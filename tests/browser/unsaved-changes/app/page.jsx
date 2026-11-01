import Link from "next/link";

export default function Page() {
  return (
    <main>
      <h1>离开守卫兼容性验证</h1>
      <Link href="/edit" prefetch={false}>
        编辑账户
      </Link>
      <Link href="/receipt" prefetch={false}>
        编辑小票
      </Link>
    </main>
  );
}
