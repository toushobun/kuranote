import Link from "next/link";

export default function Page() {
  return (
    <section style={{ minHeight: 3200 }}>
      <h1>离开守卫兼容性验证</h1>
      <div
        style={{ position: "fixed", top: 100, zIndex: 2, background: "white" }}
      >
        <Link href="/new" prefetch={false}>
          新增记账
        </Link>
        <Link href="/new?empty=1" prefetch={false}>
          无商家新增记账
        </Link>
        <Link href="/standard" prefetch={false}>
          标准支出
        </Link>
        <Link href="/standard?type=income" prefetch={false}>
          标准收入
        </Link>
        <Link href="/new-transfer" prefetch={false}>
          新增转账
        </Link>
        <Link href="/account-create" prefetch={false}>
          新增账户
        </Link>
        <Link href="/ledger-setup" prefetch={false}>
          账本创建向导
        </Link>
        <Link href="/ledger-settings" prefetch={false}>
          账本设置
        </Link>
        <Link href="/category" prefetch={false}>
          分类管理
        </Link>
        <Link href="/balance" prefetch={false}>
          余额调整
        </Link>
        <Link href="/merchant-create" prefetch={false}>
          新增商家
        </Link>
        <Link href="/merchant-edit" prefetch={false}>
          编辑商家
        </Link>
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
