import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./ConfirmDialogProvider-DGX6XirH.js";import{n as i,t as a}from"./LedgerPlaceholderMemberDialog-bYK-jjdg.js";var o,s,c,l,u,d,f,p;e((()=>{o=t(),n(),i(),s={displayName:`奶奶`,id:`placeholder-1`},c={title:`Organisms/Ledgers/LedgerPlaceholderMemberDialog`,component:a,decorators:[e=>(0,o.jsx)(r,{children:(0,o.jsx)(e,{})})],args:{actions:{delete:async()=>({}),rename:async()=>({})},ledgerId:`ledger-1`,onClose:()=>{},onCreateInvite:()=>{},onOpenInvite:()=>{},open:!0,row:{invite:null,placeholder:s}}},l={name:`改名 / 删除（未生成链接，含撤销后）`},u={name:`改名 / 删除（已生成链接）`,args:{row:{invite:{createdAt:`2026-09-01T09:30:00.000Z`,id:`invite-1`,placeholderId:s.id,role:`member`,token:`a`.repeat(64)},placeholder:s}}},d={name:`只读（非管理者）`,args:{actions:null}},f={name:`移动端`,parameters:{viewport:{defaultViewport:`mobile2`}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "改名 / 删除（未生成链接，含撤销后）"
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "改名 / 删除（已生成链接）",
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
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "只读（非管理者）",
  args: {
    actions: null
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "移动端",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...f.parameters?.docs?.source}}},p=[`EditWithoutInvite`,`EditWithBoundInvite`,`ReadOnly`,`Mobile`]}))();export{u as EditWithBoundInvite,l as EditWithoutInvite,f as Mobile,d as ReadOnly,p as __namedExportsOrder,c as default};