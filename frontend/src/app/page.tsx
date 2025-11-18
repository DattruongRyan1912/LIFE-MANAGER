import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckSquare, 
  Wallet, 
  GraduationCap, 
  MessageSquare, 
  Sparkles,
  ArrowRight 
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: CheckSquare,
      title: 'Task Management',
      description: 'Quản lý công việc thông minh với AI',
      href: '/tasks',
    },
    {
      icon: Wallet,
      title: 'Expense Tracking',
      description: 'Theo dõi chi tiêu hàng ngày',
      href: '/expenses',
    },
    {
      icon: GraduationCap,
      title: 'Study Goals',
      description: 'Lập kế hoạch học tập hiệu quả',
      href: '/study',
    },
    {
      icon: MessageSquare,
      title: 'AI Assistant',
      description: 'Trợ lý AI cá nhân 24/7',
      href: '/assistant',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          AI-Powered Life Management
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight">
          Life Manager AI
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trợ lý cuộc sống thông minh giúp bạn quản lý tasks, chi tiêu, 
          học tập và hơn thế nữa với sức mạnh của AI
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              Bắt đầu ngay
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/assistant">
            <Button size="lg" variant="outline">
              Trò chuyện với AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto mt-20 px-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.title} href={feature.href}>
              <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto mt-20 px-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">AI-Powered</div>
          <div className="text-muted-foreground mt-2">Groq LLaMA 3.3</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">Real-time</div>
          <div className="text-muted-foreground mt-2">Cập nhật tức thì</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">Minimalist</div>
          <div className="text-muted-foreground mt-2">Giao diện tối giản</div>
        </div>
      </div>
    </div>
  );
}
