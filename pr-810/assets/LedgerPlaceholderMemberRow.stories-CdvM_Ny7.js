import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./LedgerPlaceholderMemberRow-B5GuTi9d.js";var r,i,a,o,s,c,l;e((()=>{t(),r={displayName:`奶奶`,id:`placeholder-1`},i={title:`Organisms/Ledgers/LedgerPlaceholderMemberRow`,component:n,args:{canManage:!0,onClick:()=>{},row:{invite:null,placeholder:r}}},a={name:`未生成链接（含撤销后）`},o={name:`已生成链接（等待加入）`,args:{row:{invite:{createdAt:`2026-09-01T09:30:00.000Z`,id:`invite-1`,placeholderId:r.id,role:`member`,token:`a`.repeat(64)},placeholder:r}}},s={name:`只读（非管理者）`,args:{canManage:!1}},c={name:`移动端`,args:{row:{invite:null,placeholder:{displayName:`住在老家的外婆（妈妈那边）`,id:`p-2`}}},parameters:{viewport:{defaultViewport:`mobile2`}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "未生成链接（含撤销后）"
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "已生成链接（等待加入）",
  args: {
    row: {
      invite: {
        createdAt: "2026-09-01T09:30:00.000Z",
        id: "invite-1",
        placeholderId: placeholder.id,
        role: "member",
        token: "a".repeat(64)
      },
      placeholder
    }
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "只读（非管理者）",
  args: {
    canManage: false
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "移动端",
  args: {
    row: {
      invite: null,
      placeholder: {
        displayName: "住在老家的外婆（妈妈那边）",
        id: "p-2"
      }
    }
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...c.parameters?.docs?.source}}},l=[`WithoutInvite`,`WithBoundInvite`,`ReadOnly`,`Mobile`]}))();export{c as Mobile,s as ReadOnly,o as WithBoundInvite,a as WithoutInvite,l as __namedExportsOrder,i as default};