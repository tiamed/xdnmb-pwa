import { Button, Drawer } from '@heroui/react'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useReference } from '../hooks/useApi'
import { useThreadViewStore } from '../store/threadView'
import PostItem from './PostItem'
import type { Reference } from '../types/api'

function resolveThreadId(resto: string | undefined, currentTid: string) {
  // X岛: 串首 resto 为 "0"；回复的 resto 为所属串 id
  if (!resto || resto === '0') return currentTid
  return String(resto)
}

export default function ReferencePopup({ currentTid }: { currentTid: string }) {
  const postId = useThreadViewStore(s => s.referencePostId)
  const setReferencePostId = useThreadViewStore(s => s.setReferencePostId)
  const setFocusPostId = useThreadViewStore(s => s.setFocusPostId)
  const nav = useNavigate()
  const { data, isLoading, error } = useReference(postId || '')

  const resto = data ? (data as Reference).resto : undefined
  const close = () => setReferencePostId(null)

  const showOriginal = () => {
    if (!postId) return
    const targetTid = resolveThreadId(resto, currentTid)
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
          <Drawer.Footer>
            <Button
              className="w-full"
              isDisabled={isLoading || !data}
              onPress={showOriginal}
            >
              <ExternalLink size={15} />
              显示原串
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
