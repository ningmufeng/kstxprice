// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { useToast, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
// @ts-ignore;
import { LogIn } from 'lucide-react';

export default function Login(props) {
  const {
    $w,
    style,
    className
  } = props;
  const {
    toast
  } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      toast({
        title: '提示',
        description: '请输入用户名和密码',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    // 写死账号验证
    if (username === 'kstx001' && password === '001') {
      toast({
        title: '登录成功',
        description: '正在跳转...',
        variant: 'default'
      });
      setTimeout(() => {
        $w.utils.navigateTo({
          pageId: 'data-management',
          params: {}
        });
      }, 500);
    } else {
      toast({
        title: '登录失败',
        description: '用户名或密码错误',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };
  return <div style={style} className={`flex items-center justify-center min-h-screen bg-gray-100 ${className || ''}`}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl text-center">后台登录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">用户名</label>
            <Input placeholder="请输入用户名" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <Input type="password" placeholder="请输入密码" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? '登录中...' : '登录'}
          </Button>
        </CardContent>
      </Card>
    </div>;
}