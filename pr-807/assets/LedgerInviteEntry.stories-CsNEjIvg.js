import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-wioEgxdb.js";import{n as i,t as a}from"./ConfirmDialogProvider-BKHva862.js";import{i as o,n as s,r as c,t as l}from"./LedgerInviteEntry-DqALjIRm.js";function u(e){return(0,f.jsx)(c,{pendingInvites:e.canInvite?g:g.map(e=>({...e,token:null})),children:(0,f.jsx)(l,{...e})})}function d(e){return(0,f.jsx)(r,{storageScope:`storybook-ledger-invite-entry`,children:(0,f.jsx)(a,{children:(0,f.jsx)(c,{pendingInvites:e.canInvite?[E,...g]:[],children:(0,f.jsx)(l,{...e})})})})}var f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M;e((()=>{f=t(),i(),n(),s(),o(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h=async()=>({}),g=[{createdAt:`2026-07-13T09:00:00.000Z`,id:`storybook-invite-id`,placeholderId:null,role:`member`,token:`storybook-pending-invite-token`}],_={title:`Organisms/Ledgers/LedgerInviteEntry`,component:l,decorators:[e=>(0,f.jsx)(c,{pendingInvites:[],children:(0,f.jsx)(e,{})})],args:{action:h,canInvite:!0,ledgerId:`storybook-ledger`,token:null}},v={name:`无待邀请且尚未生成链接`},y={name:`已生成邀请链接`,args:{token:`storybook-invite-token`}},b={name:`存在待接受邀请`,render:u},x={name:`撤销邀请确认`,render:u,play:async({canvasElement:e})=>{let t=m(e);await p.click(await t.findByRole(`button`,{name:/待接受邀请/})),await p.click(await m(document.body).findByRole(`button`,{name:`撤销邀请`})),await m(document.body).findByRole(`heading`,{name:`确认撤销邀请？`})}},S={name:`普通成员查看待接受邀请`,args:{canInvite:!1},render:u},C={name:`无邀请权限且无待邀请`,args:{canInvite:!1}},w={name:`生成邀请链接失败`,args:{action:async()=>({error:`邀请链接生成失败，请稍后重试。`,errorKey:`storybook-create-failed`,operation:`create`})},play:async({canvasElement:e})=>{let t=m(e);await p.click(await t.findByRole(`button`,{name:`邀请成员`})),await p.click(await m(document.body).findByRole(`button`,{name:`生成邀请链接`})),await m(document.body).findByRole(`heading`,{name:`生成邀请链接失败`})}},T=[{displayName:`奶奶`,id:`storybook-placeholder-1`},{displayName:`爷爷`,id:`storybook-placeholder-2`}],E={createdAt:`2026-09-01T09:30:00.000Z`,id:`storybook-bound-invite-id`,placeholderId:T[0].id,role:`member`,token:`storybook-bound-invite-token`},D={create:async()=>({}),delete:async()=>({}),rename:async()=>({})},O={name:`待邀请成员（含绑定邀请）与匿名邀请`,args:{placeholderMemberActions:D,placeholderMembers:T},render:d},k={name:`绑定邀请的复制区域（接管说明）`,args:{placeholderMemberActions:D,placeholderMembers:T},render:d,play:async({canvasElement:e})=>{let t=m(e);await p.click(await t.findByRole(`button`,{name:`奶奶，待接受邀请`})),await p.click(await m(document.body).findByRole(`button`,{name:/查看邀请链接/}))}},A={...k,name:`绑定邀请的复制区域（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},j={name:`待邀请成员（非管理者只读）`,args:{canInvite:!1,placeholderMemberActions:null,placeholderMembers:T},render:d},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "无待邀请且尚未生成链接"
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "已生成邀请链接",
  args: {
    token: "storybook-invite-token"
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "存在待接受邀请",
  render: renderWithPendingInvites
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "撤销邀请确认",
  render: renderWithPendingInvites,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: /待接受邀请/
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: "撤销邀请"
    }));
    await within(document.body).findByRole("heading", {
      name: "确认撤销邀请？"
    });
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "普通成员查看待接受邀请",
  args: {
    canInvite: false
  },
  render: renderWithPendingInvites
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "无邀请权限且无待邀请",
  args: {
    canInvite: false
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "生成邀请链接失败",
  args: {
    action: async () => ({
      error: "邀请链接生成失败，请稍后重试。",
      errorKey: "storybook-create-failed",
      operation: "create"
    })
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "邀请成员"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: "生成邀请链接"
    }));
    await within(document.body).findByRole("heading", {
      name: "生成邀请链接失败"
    });
  }
}`,...w.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "待邀请成员（含绑定邀请）与匿名邀请",
  args: {
    placeholderMemberActions,
    placeholderMembers
  },
  render: renderWithPlaceholders
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "绑定邀请的复制区域（接管说明）",
  args: {
    placeholderMemberActions,
    placeholderMembers
  },
  render: renderWithPlaceholders,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "奶奶，待接受邀请"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: /查看邀请链接/
    }));
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  ...BoundInviteCopyArea,
  name: "绑定邀请的复制区域（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "待邀请成员（非管理者只读）",
  args: {
    canInvite: false,
    placeholderMemberActions: null,
    placeholderMembers
  },
  render: renderWithPlaceholders
}`,...j.parameters?.docs?.source}}},M=[`NoLink`,`WithLink`,`PendingInvite`,`RevokeConfirmation`,`PendingInviteReadonly`,`ReadOnly`,`WithError`,`WithPlaceholderMembers`,`BoundInviteCopyArea`,`BoundInviteCopyAreaMobile`,`PlaceholderReadOnly`]}))();export{k as BoundInviteCopyArea,A as BoundInviteCopyAreaMobile,v as NoLink,b as PendingInvite,S as PendingInviteReadonly,j as PlaceholderReadOnly,C as ReadOnly,x as RevokeConfirmation,w as WithError,y as WithLink,O as WithPlaceholderMembers,M as __namedExportsOrder,_ as default};