import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LingoCraft — Xưởng luyện ngôn ngữ cá nhân',
  description:
    'Học tiếng Anh và tiếng Nhật với nội dung của bạn: bản đồ kiến thức, lịch ôn FSRS và trò chơi ngôn ngữ.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
