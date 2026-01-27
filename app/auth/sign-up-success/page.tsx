import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">تم إنشاء الحساب بنجاح!</CardTitle>
            <CardDescription className="mt-3 text-base">
              تم إرسال رابط التفعيل إلى بريدك الإلكتروني
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Mail className="w-5 h-5" />
              <span>يرجى التحقق من صندوق الوارد</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            إذا لم تجد الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها
          </p>

          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/auth/login">
              العودة إلى تسجيل الدخول
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
