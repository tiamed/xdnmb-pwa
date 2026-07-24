import { Button, Drawer } from '@heroui/react'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useReference } from '../hooks/useApi'
import { useThreadViewStore } from '../store/threadView'
import PostItem from './PostItem'
import type { Reference } from '../types/api'

export default function ReferencePopup({ currentTid }: { currentTid: string }) {
  const postId = useThreadViewStore((s) => s.referencePostId)
  const setReferencePostId = useThreadViewStore((s) => s.setReferencePostId)
  const nav = useNavigate()
  const { data, isLoading, error } = useReference(postId || '')

  const resto = data && (data as Reference).resto

  return (
    <Drawer>
      <Drawer.Backdrop
        isOpen={!!postId}
        onOpenChange={(open) => {
          if (!open) setReferencePostId(null)
        }}
      >
        <Drawer.Content placement="bottom">
          <Drawer.Dialog>
            <Drawer.Handle />
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>引用 No.{postId}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
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
                  isDisabled={isLoading}
                  onPress={() => {
                    setReferencePostId(null)
                    nav(`/t/${resto || currentTid}`)
                  }}
                >
                  <ExternalLink size={15} />
                  显示原串
                </Button>
              </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}