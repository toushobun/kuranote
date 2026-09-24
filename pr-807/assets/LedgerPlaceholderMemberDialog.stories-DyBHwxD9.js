import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-wioEgxdb.js";import{n as i,t as a}from"./ConfirmDialogProvider-BKHva862.js";import{n as o,t as s}from"./LedgerPlaceholderMemberDialog-Cdjfd7Dn.js";var c,l,u,d,f,p,m,h,g;e((()=>{c=t(),i(),n(),o(),l={displayName:`奶奶`,id:`placeholder-1`},u={title:`Organisms/Ledgers/LedgerPlaceholderMemberDialog`,component:s,decorators:[e=>(0,c.jsx)(r,{storageScope:`storybook-placeholder-member-dialog`,children:(0,c.jsx)(a,{children:(0,c.jsx)(e,{})})})],args:{actions:{create:async()=>({}),delete:async()=>({}),rename:async()=>({})},ledgerId:`ledger-1`,mode:`edit`,onClose:()=>{},onCreateInvite:()=>{},onOpenInvite:()=>{},open:!0,row:{invite:null,placeholder:l}}},d={name:`添加待邀请成员`,args:{mode:`create`,row:null}},f={name:`改名 / 删除（无邀请）`},p={name:`改名 / 删除（有绑定邀请）`,args:{row:{invite:{createdAt:`2026-09-01T09:30:00.000Z`,id:`invite-1`,placeholderId:l.id,role:`member`,token:`a`.repeat(64)},placeholder:l}}},m={name:`只读（非管理者）`,args:{actions:null}},h={name:`移动端`,parameters:{viewport:{defaultViewport:`mobile2`}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "添加待邀请成员",
  args: {
    mode: "create",
    row: null
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "改名 / 删除（无邀请）"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "改名 / 删除（有绑定邀请）",
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
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "只读（非管理者）",
  args: {
    actions: null
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "移动端",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...h.parameters?.docs?.source}}},g=[`Create`,`EditWithoutInvite`,`EditWithBoundInvite`,`ReadOnly`,`Mobile`]}))();export{d as Create,p as EditWithBoundInvite,f as EditWithoutInvite,h as Mobile,m as ReadOnly,g as __namedExportsOrder,u as default};