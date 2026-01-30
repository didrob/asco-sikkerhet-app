import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  full_name?: string
  site_id?: string
  role?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth header to verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token to verify admin status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Get the calling user
    const { data: { user: callingUser }, error: authError } = await userClient.auth.getUser()
    if (authError || !callingUser) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify caller is admin using the database function
    const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin', {
      _user_id: callingUser.id,
    })

    if (adminError || !isAdmin) {
      console.error('Admin check failed:', adminError)
      return new Response(
        JSON.stringify({ error: 'Bare administratorer kan opprette brukere' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, full_name, site_id, role }: CreateUserRequest = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'E-post og passord er påkrevd' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create the user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email },
    })

    if (createError) {
      console.error('Create user error:', createError)
      
      // Handle specific error cases
      if (createError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'En bruker med denne e-postadressen finnes allerede' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User created:', newUser.user.id)

    // Assign user to site if specified
    if (site_id) {
      const { error: siteError } = await adminClient
        .from('user_site_assignments')
        .insert({
          user_id: newUser.user.id,
          site_id,
          assigned_by: callingUser.id,
        })

      if (siteError) {
        console.error('Site assignment error:', siteError)
        // Don't fail the whole operation, just log
      } else {
        console.log('User assigned to site:', site_id)
      }
    }

    // Assign role if specified
    if (role && site_id) {
      const { error: roleError } = await adminClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          site_id,
          role,
        })

      if (roleError) {
        console.error('Role assignment error:', roleError)
        // Don't fail the whole operation, just log
      } else {
        console.log('Role assigned:', role)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'En uventet feil oppstod' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
