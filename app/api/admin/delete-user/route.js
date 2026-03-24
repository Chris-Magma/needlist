import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function DELETE(request) {
  const { userId } = await request.json()
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 })

  const authHeader = request.headers.get('authorization')
  if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  // Verify caller is an admin
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    console.error('[delete-user] auth verification failed:', authError)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!callerProfile?.is_admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  console.log('[delete-user] userId to delete:', userId)

  // Step 1: verify service role has admin access via listUsers
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 })
  if (listError) {
    console.error('[delete-user] listUsers failed — service role likely invalid:', listError)
    return Response.json({ error: 'Service role check failed: ' + listError.message }, { status: 500 })
  }
  console.log('[delete-user] listUsers OK, total users sample:', listData?.users?.length)

  // Step 2: try auth.admin.deleteUser first
  console.log('[delete-user] attempting auth.admin.deleteUser...')
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (!deleteError) {
    console.log('[delete-user] auth.admin.deleteUser succeeded')
    return Response.json({ ok: true, method: 'admin_api' })
  }

  console.error('[delete-user] auth.admin.deleteUser failed:', JSON.stringify(deleteError, null, 2))
  console.log('[delete-user] falling back to SQL RPC...')

  // Step 3: fallback — delete via SQL RPC (requires the function below to exist)
  const { error: rpcError } = await supabaseAdmin.rpc('delete_user_by_id', { user_id: userId })
  if (rpcError) {
    console.error('[delete-user] rpc delete_user_by_id failed:', JSON.stringify(rpcError, null, 2))
    return Response.json({
      error: rpcError.message,
      code: rpcError.code,
      adminApiError: deleteError.message,
    }, { status: 500 })
  }

  console.log('[delete-user] SQL RPC delete succeeded')
  return Response.json({ ok: true, method: 'rpc' })
}
