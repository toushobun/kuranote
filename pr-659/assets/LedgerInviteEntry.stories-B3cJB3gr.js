import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{i as n,n as r,r as i,t as a}from"./LedgerInviteEntry-CHX0szG0.js";function o(e){return(0,s.jsx)(i,{pendingInvites:e.canInvite?d:d.map(e=>({...e,token:null})),children:(0,s.jsx)(a,{...e})})}var s,c,l,u,d,f,p,m,h,g,_,v,y,b;e((()=>{s=t(),r(),n(),{userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u=async()=>({}),d=[{createdAt:`2026-07-13T09:00:00.000Z`,id:`storybook-invite-id`,role:`member`,token:`storybook-pending-invite-token`}],f={title:`Organisms/Ledgers/LedgerInviteEntry`,component:a,decorators:[e=>(0,s.jsx)(i,{pendingInvites:[],children:(0,s.jsx)(e,{})})],args:{action:u,canInvite:!0,ledgerId:`storybook-ledger`,token:null}},p={name:`无待邀请且尚未生成链接`},m={name:`已生成邀请链接`,args:{token:`storybook-invite-token`}},h={name:`存在待接受邀请`,render:o},g={name:`撤销邀请确认`,render:o,play:async({canvasElement:e})=>{let t=l(e);await c.click(await t.findByRole(`button`,{name:/待接受邀请/})),await c.click(await l(document.body).findByRole(`button`,{name:`撤销邀请`})),await l(document.body).findByRole(`heading`,{name:`确认撤销邀请？`})}},_={name:`普通成员查看待接受邀请`,args:{canInvite:!1},render:o},v={name:`无邀请权限且无待邀请`,args:{canInvite:!1}},y={name:`生成邀请链接失败`,args:{action:async()=>({error:`邀请链接生成失败，请稍后重试。`,errorKey:`storybook-create-failed`,operation:`create`})},play:async({canvasElement:e})=>{let t=l(e);await c.click(await t.findByRole(`button`,{name:`邀请成员`})),await c.click(await l(document.body).findByRole(`button`,{name:`生成邀请链接`})),await l(document.body).findByRole(`heading`,{name:`生成邀请链接失败`})}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "无待邀请且尚未生成链接"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "已生成邀请链接",
  args: {
    token: "storybook-invite-token"
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "存在待接受邀请",
  render: renderWithPendingInvites
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "普通成员查看待接受邀请",
  args: {
    canInvite: false
  },
  render: renderWithPendingInvites
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "无邀请权限且无待邀请",
  args: {
    canInvite: false
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b=[`NoLink`,`WithLink`,`PendingInvite`,`RevokeConfirmation`,`PendingInviteReadonly`,`ReadOnly`,`WithError`]}))();export{p as NoLink,h as PendingInvite,_ as PendingInviteReadonly,v as ReadOnly,g as RevokeConfirmation,y as WithError,m as WithLink,b as __namedExportsOrder,f as default};