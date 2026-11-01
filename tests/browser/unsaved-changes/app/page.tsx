import Link from "next/link";

export default function Page() {
  return (
    <section style={{ minHeight: 3200 }}>
      <h1>离开守卫兼容性验证</h1>
      <div
        style={{ position: "fixed", top: 100, zIndex: 2, background: "white" }}
      >
        <Link href="/edit" prefetch={false}>
          编辑账户
        </Link>
        <Link href="/receipt" prefetch={false}>
          编辑小票
        </Link>
        <Link href="/transfer" prefetch={false}>
          编辑转账
        </Link>
      </div>
    </section>
  );
}
