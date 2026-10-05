import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-DvRYaTPA.js";import{n as i,t as a}from"./ConfirmDialogProvider-BGxhcIbV.js";import{o,s,t as c}from"./ledger-BxnbE1SC.js";import{i as l,n as u,r as d,t as f}from"./LedgerInviteEntry-CMd3aRfu.js";function p(e){return(0,h.jsx)(r,{storageScope:`storybook-ledger-invite-entry`,children:(0,h.jsx)(a,{children:(0,h.jsx)(d,{pendingInvites:e.canInvite?[b]:[],children:(0,h.jsx)(f,{...e})})})})}async function m(e){await g.click(await _(e).findByRole(`button`,{name:/^邀请成员/}))}var h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R;e((()=>{h=t(),c(),i(),n(),u(),l(),{userEvent:g,within:_}=__STORYBOOK_MODULE_TEST__,v=async()=>({}),y=[{displayName:`奶奶`,id:`storybook-placeholder-1`},{displayName:`爷爷`,id:`storybook-placeholder-2`}],b={createdAt:`2026-09-01T09:30:00.000Z`,id:`storybook-bound-invite-id`,placeholderId:y[0].id,role:`member`,token:`storybook-bound-invite-token`},x={delete:async()=>({}),rename:async()=>({})},S={title:`Organisms/Ledgers/LedgerInviteEntry`,component:f,args:{action:v,canInvite:!0,ledgerId:`storybook-ledger`,ledgerName:`家庭账本`,placeholderMemberActions:x,placeholderMembers:y,token:null},render:p},C={name:`待邀请成员（已生成 / 未生成链接）与邀请成员入口`},w={...C,name:`待邀请成员列表（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},T={name:`暂无待邀请成员`,args:{placeholderMembers:[]}},E={name:`邀请成员弹框（填写名字与权限）`,play:async({canvasElement:e})=>{await m(e)}},D={...E,name:`邀请成员弹框（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},O={name:`邀请成员失败（同名）`,args:{action:async()=>({error:s[o.inviteMemberNameConflict],errorKey:`storybook-invite-failed`,operation:`invite`})},play:async({canvasElement:e})=>{await m(e);let t=_(document.body);await g.type(await t.findByLabelText(/名字/),`奶奶`),await g.click(await t.findByRole(`button`,{name:`生成邀请链接`})),await t.findByRole(`heading`,{name:`邀请成员失败`})}},k={name:`已添加但链接生成失败（部分成功）`,args:{action:async()=>({error:`已添加「小明」，但邀请链接生成失败，请在列表中重新生成。`,errorKey:`storybook-link-failed`,operation:`invite`})},play:O.play},A={name:`邀请成功后在同一弹框显示链接与身份说明`,args:{token:`storybook-invite-token`},play:async()=>{window.history.replaceState(null,``,`#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=${y[1].id}`),window.dispatchEvent(new Event(`hashchange`))}},j={...A,name:`邀请成功（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},M={name:`已生成链接：复制区域（身份说明）`,play:async({canvasElement:e})=>{await g.click(await _(e).findByRole(`button`,{name:`奶奶，等待加入`})),await g.click(await _(document.body).findByRole(`button`,{name:/查看邀请链接/}))}},N={...M,name:`已生成链接：复制区域（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},P={name:`撤销链接确认`,play:async e=>{await M.play?.(e);let t=_(document.body);await g.click(await t.findByRole(`button`,{name:`撤销邀请`})),await t.findByRole(`heading`,{name:`确认撤销邀请？`})}},F={name:`未生成链接（含撤销后）：重新生成`,play:async({canvasElement:e})=>{await g.click(await _(e).findByRole(`button`,{name:`爷爷，未生成链接`})),await g.click(await _(document.body).findByRole(`button`,{name:/生成专属邀请链接/}))}},I={name:`普通成员只读（无邀请权限）`,args:{canInvite:!1,placeholderMemberActions:null}},L={...I,name:`普通成员只读（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "待邀请成员（已生成 / 未生成链接）与邀请成员入口"
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  ...MemberList,
  name: "待邀请成员列表（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "暂无待邀请成员",
  args: {
    placeholderMembers: []
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "邀请成员弹框（填写名字与权限）",
  play: async ({
    canvasElement
  }) => {
    await openInviteDialog(canvasElement);
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  ...InviteDialog,
  name: "邀请成员弹框（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "邀请成员失败（同名）",
  args: {
    action: async () => ({
      error: ledgerInviteErrorMessages[ledgerInviteErrorCodes.inviteMemberNameConflict],
      errorKey: "storybook-invite-failed",
      operation: "invite"
    })
  },
  play: async ({
    canvasElement
  }) => {
    await openInviteDialog(canvasElement);
    const body = within(document.body);
    await userEvent.type(await body.findByLabelText(/名字/), "奶奶");
    await userEvent.click(await body.findByRole("button", {
      name: "生成邀请链接"
    }));
    await body.findByRole("heading", {
      name: "邀请成员失败"
    });
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "已添加但链接生成失败（部分成功）",
  args: {
    action: async () => ({
      error: "已添加「小明」，但邀请链接生成失败，请在列表中重新生成。",
      errorKey: "storybook-link-failed",
      operation: "invite"
    })
  },
  play: InviteFailed.play
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "邀请成功后在同一弹框显示链接与身份说明",
  args: {
    token: "storybook-invite-token"
  },
  play: async () => {
    // 模拟 Action 成功后的 fragment：新成员 ID 用于定位名字。
    window.history.replaceState(null, "", \`#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=\${placeholderMembers[1].id}\`);
    window.dispatchEvent(new Event("hashchange"));
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  ...CreatedLink,
  name: "邀请成功（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "已生成链接：复制区域（身份说明）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", {
      name: "奶奶，等待加入"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: /查看邀请链接/
    }));
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  ...BoundInviteCopyArea,
  name: "已生成链接：复制区域（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "撤销链接确认",
  play: async context => {
    await BoundInviteCopyArea.play?.(context);
    const body = within(document.body);
    await userEvent.click(await body.findByRole("button", {
      name: "撤销邀请"
    }));
    await body.findByRole("heading", {
      name: "确认撤销邀请？"
    });
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "未生成链接（含撤销后）：重新生成",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", {
      name: "爷爷，未生成链接"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: /生成专属邀请链接/
    }));
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "普通成员只读（无邀请权限）",
  args: {
    canInvite: false,
    placeholderMemberActions: null
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  ...ReadOnly,
  name: "普通成员只读（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...L.parameters?.docs?.source}}},R=[`MemberList`,`MemberListMobile`,`Empty`,`InviteDialog`,`InviteDialogMobile`,`InviteFailed`,`LinkFailedPartially`,`CreatedLink`,`CreatedLinkMobile`,`BoundInviteCopyArea`,`BoundInviteCopyAreaMobile`,`RevokeConfirmation`,`RegenerateLink`,`ReadOnly`,`ReadOnlyMobile`]}))();export{M as BoundInviteCopyArea,N as BoundInviteCopyAreaMobile,A as CreatedLink,j as CreatedLinkMobile,T as Empty,E as InviteDialog,D as InviteDialogMobile,O as InviteFailed,k as LinkFailedPartially,C as MemberList,w as MemberListMobile,I as ReadOnly,L as ReadOnlyMobile,F as RegenerateLink,P as RevokeConfirmation,R as __namedExportsOrder,S as default};