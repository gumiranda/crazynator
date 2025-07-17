interface Props {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: Props) {
  return (
    <main className="flex flex-col min-h-screen max-h-screen">
      <div className="flex-1 flex flex-col px-4 pb-4">{children}</div>
    </main>
  );
}
