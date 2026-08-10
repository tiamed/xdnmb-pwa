import { useMemo } from 'react'
import { Button, Drawer } from '@heroui/react'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useReference } from '../hooks/useApi'
import { getThread } from '../api/client'
import { useThreadViewStore } from '../store/threadView'
import PostItem from './PostItem'
import type { Reference } from '../types/api'

const THREAD_GONE = '该串不存在'

/** 解析引用所属串 id：串首 resto 为 0，串 id 即自身 id；回复的 resto 为所属串 id */
function resolveThreadId(ref: Reference | undefined, postId: string, currentTid: string) {
  const resto = ref?.resto != null ? String(ref.resto) : ''
  if (!resto || resto === '0') return postId
  return resto || currentTid
}

async function threadExists(threadId: string): Promise<boolean> {
  try {
    await getThread(threadId, 1)
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === THREAD_GONE) return false
    throw e
  }
}

export default function ReferencePopup({ currentTid }: { currentTid: string }) {
  const postId = useThreadViewStore(s => s.referencePostId)
  const setReferencePostId = useThreadViewStore(s => s.setReferencePostId)
  const setFocusPostId = useThreadViewStore(s => s.setFocusPostId)
  const nav = useNavigate()
  const { data, isLoading, error } = useReference(postId || '')

  const targetTid = useMemo(
    () => (postId && data ? resolveThreadId(data as Reference, postId, currentTid) : ''),
    [postId, data, currentTid],
  )
  const sameThread = !!targetTid && targetTid === currentTid

  const { data: exists, isLoading: checking } = useQuery({
    queryKey: ['threadExists', targetTid],
    queryFn: () => threadExists(targetTid),
    enabled: !!postId && !!data && !!targetTid && !sameThread,
    staleTime: Infinity,
    retry: false,
  })

  const showOriginalBtn = !!data && (sameThread || exists === true)
  const originalPending = !!data && !sameThread && checking

  const close = () => setReferencePostId(null)

  const showOriginal = () => {
    if (!postId || !targetTid) return
    close()
    setFocusPostId(postId)
    if (targetTid !== currentTid) {
      nav(`/t/${targetTid}`)
    }
  }

  return (
    <Drawer.Backdrop
      isOpen={!!postId}
      onOpenChange={open => { if (!open) close() }}
    >
      <Drawer.Content placement="bottom">
        <Drawer.Dialog className="max-h-[75vh]">
          <Drawer.Handle />
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>引用 No.{postId}</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="px-0">
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-divider border-t-accent rounded-full animate-spin" />
              </div>
            )}
            {error && <p className="text-danger text-sm text-center py-4">加载失败</p>}
            {data && <PostItem post={data} showReply={false} />}
          </Drawer.Body>
          {(showOriginalBtn || originalPending) && (
            <Drawer.Footer>
              <Button
                className="w-full"
                isDisabled={isLoading || !showOriginalBtn || originalPending}
                onPress={showOriginal}
              >
                <ExternalLink size={15} />
                {originalPending ? '检查原串…' : '显示原串'}
              </Button>
            </Drawer.Footer>
          )}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
