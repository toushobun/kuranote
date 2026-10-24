import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./ConfirmDialogProvider-BhklGG2x.js";import{t as i,v as a,y as o}from"./ledger-C8-0g9Kb.js";import{i as s,n as c,r as l,t as u}from"./LedgerInviteEntry-CSYZwKan.js";function d(e){return(0,p.jsx)(r,{children:(0,p.jsx)(l,{pendingInvites:e.canInvite?[v]:[],children:(0,p.jsx)(u,{...e})})})}async function f(e){await m.click(await h(e).findByRole(`button`,{name:/^邀请成员/}))}var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I;e((()=>{p=t(),i(),n(),c(),s(),{userEvent:m,within:h}=__STORYBOOK_MODULE_TEST__,g=async()=>({}),_=[{displayName:`奶奶`,id:`storybook-placeholder-1`},{displayName:`爷爷`,id:`storybook-placeholder-2`}],v={createdAt:`2026-09-01T09:30:00.000Z`,id:`storybook-bound-invite-id`,placeholderId:_[0].id,role:`member`,token:`storybook-bound-invite-token`},y={delete:async()=>({}),rename:async()=>({})},b={title:`Organisms/Ledgers/LedgerInviteEntry`,component:u,args:{action:g,canInvite:!0,ledgerId:`storybook-ledger`,ledgerName:`家庭账本`,placeholderMemberActions:y,placeholderMembers:_,token:null},render:d},x={name:`待邀请成员（已生成 / 未生成链接）与邀请成员入口`},S={...x,name:`待邀请成员列表（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},C={name:`暂无待邀请成员`,args:{placeholderMembers:[]}},w={name:`邀请成员弹框（填写名字与权限）`,play:async({canvasElement:e})=>{await f(e)}},T={...w,name:`邀请成员弹框（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},E={name:`邀请成员失败（同名）`,args:{action:async()=>({error:o[a.inviteMemberNameConflict],errorKey:`storybook-invite-failed`,operation:`invite`})},play:async({canvasElement:e})=>{await f(e);let t=h(document.body);await m.type(await t.findByLabelText(/名字/),`奶奶`),await m.click(await t.findByRole(`button`,{name:`生成邀请链接`})),await t.findByRole(`heading`,{name:`邀请成员失败`})}},D={name:`已添加但链接生成失败（部分成功）`,args:{action:async()=>({error:`已添加「小明」，但邀请链接生成失败，请在列表中重新生成。`,errorKey:`storybook-link-failed`,operation:`invite`})},play:E.play},O={name:`邀请成功后在同一弹框显示链接与身份说明`,args:{token:`storybook-invite-token`},play:async()=>{window.history.replaceState(null,``,`#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=${_[1].id}`),window.dispatchEvent(new Event(`hashchange`))}},k={...O,name:`邀请成功（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},A={name:`已生成链接：复制区域（身份说明）`,play:async({canvasElement:e})=>{await m.click(await h(e).findByRole(`button`,{name:`奶奶，等待加入`})),await m.click(await h(document.body).findByRole(`button`,{name:/查看邀请链接/}))}},j={...A,name:`已生成链接：复制区域（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},M={name:`撤销链接确认`,play:async e=>{await A.play?.(e);let t=h(document.body);await m.click(await t.findByRole(`button`,{name:`撤销邀请`})),await t.findByRole(`heading`,{name:`确认撤销邀请？`})}},N={name:`未生成链接（含撤销后）：重新生成`,play:async({canvasElement:e})=>{await m.click(await h(e).findByRole(`button`,{name:`爷爷，未生成链接`})),await m.click(await h(document.body).findByRole(`button`,{name:/生成专属邀请链接/}))}},P={name:`普通成员只读（无邀请权限）`,args:{canInvite:!1,placeholderMemberActions:null}},F={...P,name:`普通成员只读（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "待邀请成员（已生成 / 未生成链接）与邀请成员入口"
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  ...MemberList,
  name: "待邀请成员列表（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "暂无待邀请成员",
  args: {
    placeholderMembers: []
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "邀请成员弹框（填写名字与权限）",
  play: async ({
    canvasElement
  }) => {
    await openInviteDialog(canvasElement);
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  ...InviteDialog,
  name: "邀请成员弹框（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "已添加但链接生成失败（部分成功）",
  args: {
    action: async () => ({
      error: "已添加「小明」，但邀请链接生成失败，请在列表中重新生成。",
      errorKey: "storybook-link-failed",
      operation: "invite"
    })
  },
  play: InviteFailed.play
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "邀请成功后在同一弹框显示链接与身份说明",
  args: {
    token: "storybook-invite-token"
  },
  play: async () => {
    // 模拟 Action 成功后的 fragment：新成员 ID 用于定位名字。
    window.history.replaceState(null, "", \`#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=\${placeholderMembers[1].id}\`);
    window.dispatchEvent(new Event("hashchange"));
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  ...CreatedLink,
  name: "邀请成功（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
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
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  ...BoundInviteCopyArea,
  name: "已生成链接：复制区域（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
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
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "普通成员只读（无邀请权限）",
  args: {
    canInvite: false,
    placeholderMemberActions: null
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  ...ReadOnly,
  name: "普通成员只读（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...F.parameters?.docs?.source}}},I=[`MemberList`,`MemberListMobile`,`Empty`,`InviteDialog`,`InviteDialogMobile`,`InviteFailed`,`LinkFailedPartially`,`CreatedLink`,`CreatedLinkMobile`,`BoundInviteCopyArea`,`BoundInviteCopyAreaMobile`,`RevokeConfirmation`,`RegenerateLink`,`ReadOnly`,`ReadOnlyMobile`]}))();export{A as BoundInviteCopyArea,j as BoundInviteCopyAreaMobile,O as CreatedLink,k as CreatedLinkMobile,C as Empty,w as InviteDialog,T as InviteDialogMobile,E as InviteFailed,D as LinkFailedPartially,x as MemberList,S as MemberListMobile,P as ReadOnly,F as ReadOnlyMobile,N as RegenerateLink,M as RevokeConfirmation,I as __namedExportsOrder,b as default};