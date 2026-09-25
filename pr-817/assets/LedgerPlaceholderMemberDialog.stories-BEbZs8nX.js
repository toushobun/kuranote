import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-DPCTiQ3F.js";import{n as i,t as a}from"./ConfirmDialogProvider-QufAMH5x.js";import{n as o,t as s}from"./LedgerPlaceholderMemberDialog-DXNL0Av0.js";var c,l,u,d,f,p,m,h;e((()=>{c=t(),i(),n(),o(),l={displayName:`奶奶`,id:`placeholder-1`},u={title:`Organisms/Ledgers/LedgerPlaceholderMemberDialog`,component:s,decorators:[e=>(0,c.jsx)(r,{storageScope:`storybook-placeholder-member-dialog`,children:(0,c.jsx)(a,{children:(0,c.jsx)(e,{})})})],args:{actions:{delete:async()=>({}),rename:async()=>({})},ledgerId:`ledger-1`,onClose:()=>{},onCreateInvite:()=>{},onOpenInvite:()=>{},open:!0,row:{invite:null,placeholder:l}}},d={name:`改名 / 删除（未生成链接，含撤销后）`},f={name:`改名 / 删除（已生成链接）`,args:{row:{invite:{createdAt:`2026-09-01T09:30:00.000Z`,id:`invite-1`,placeholderId:l.id,role:`member`,token:`a`.repeat(64)},placeholder:l}}},p={name:`只读（非管理者）`,args:{actions:null}},m={name:`移动端`,parameters:{viewport:{defaultViewport:`mobile2`}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "改名 / 删除（未生成链接，含撤销后）"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "只读（非管理者）",
  args: {
    actions: null
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "移动端",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...m.parameters?.docs?.source}}},h=[`EditWithoutInvite`,`EditWithBoundInvite`,`ReadOnly`,`Mobile`]}))();export{f as EditWithBoundInvite,d as EditWithoutInvite,m as Mobile,p as ReadOnly,h as __namedExportsOrder,u as default};