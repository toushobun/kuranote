import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{t as n,v as r,y as i}from"./ledger-C8-0g9Kb.js";import{n as a,t as o}from"./ConfirmDialogProvider-bH6GDtF2.js";import{i as s,n as c,r as l,t as u}from"./LedgerInviteEntry-CnfmEZjw.js";function d(e){return(0,p.jsx)(o,{children:(0,p.jsx)(l,{pendingInvites:e.canInvite?[y]:[],children:(0,p.jsx)(u,{...e})})})}async function f(e){await h.click(await g(e).findByRole(`button`,{name:/^邀请成员/}))}var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L;e((()=>{p=t(),n(),a(),c(),s(),{expect:m,userEvent:h,within:g}=__STORYBOOK_MODULE_TEST__,_=async()=>({}),v=[{displayName:`奶奶`,id:`storybook-placeholder-1`},{displayName:`爷爷`,id:`storybook-placeholder-2`}],y={createdAt:`2026-09-01T09:30:00.000Z`,id:`storybook-bound-invite-id`,placeholderId:v[0].id,role:`member`,token:`storybook-bound-invite-token`},b={delete:async()=>({}),rename:async()=>({})},x={title:`Organisms/Ledgers/LedgerInviteEntry`,component:u,args:{action:_,canInvite:!0,ledgerId:`storybook-ledger`,ledgerName:`家庭账本`,placeholderMemberActions:b,placeholderMembers:v,token:null},render:d},S={name:`待邀请成员（已生成 / 未生成链接）与邀请成员入口`},C={...S,name:`待邀请成员列表（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},w={name:`暂无待邀请成员`,args:{placeholderMembers:[]}},T={name:`邀请成员弹框（填写名字与权限）`,play:async({canvasElement:e})=>{await f(e)}},E={...T,name:`邀请成员弹框（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},D={name:`邀请成员失败（同名）`,args:{action:async()=>({error:i[r.inviteMemberNameConflict],errorKey:`storybook-invite-failed`,operation:`invite`})},play:async({canvasElement:e})=>{await f(e);let t=g(document.body);await h.type(await t.findByLabelText(/名字/),`奶奶`),await h.click(await t.findByRole(`button`,{name:`生成邀请链接`})),await m(await t.findByRole(`alert`)).toHaveTextContent(`邀请成员失败`)}},O={name:`已添加但链接生成失败（部分成功）`,args:{action:async()=>({error:`已添加「小明」，但邀请链接生成失败，请在列表中重新生成。`,errorKey:`storybook-link-failed`,operation:`invite`})},play:D.play},k={name:`邀请成功后在同一弹框显示链接与身份说明`,args:{token:`storybook-invite-token`},play:async()=>{window.history.replaceState(null,``,`#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=${v[1].id}`),window.dispatchEvent(new Event(`hashchange`))}},A={...k,name:`邀请成功（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},j={name:`已生成链接：复制区域（身份说明）`,play:async({canvasElement:e})=>{await h.click(await g(e).findByRole(`button`,{name:`奶奶，等待加入`})),await h.click(await g(document.body).findByRole(`button`,{name:/查看邀请链接/}))}},M={...j,name:`已生成链接：复制区域（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},N={name:`撤销链接确认`,play:async e=>{await j.play?.(e);let t=g(document.body);await h.click(await t.findByRole(`button`,{name:`撤销邀请`})),await t.findByRole(`heading`,{name:`确认撤销邀请？`})}},P={name:`未生成链接（含撤销后）：重新生成`,play:async({canvasElement:e})=>{await h.click(await g(e).findByRole(`button`,{name:`爷爷，未生成链接`})),await h.click(await g(document.body).findByRole(`button`,{name:/生成专属邀请链接/}))}},F={name:`普通成员只读（无邀请权限）`,args:{canInvite:!1,placeholderMemberActions:null}},I={...F,name:`普通成员只读（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "待邀请成员（已生成 / 未生成链接）与邀请成员入口"
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  ...MemberList,
  name: "待邀请成员列表（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "暂无待邀请成员",
  args: {
    placeholderMembers: []
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "邀请成员弹框（填写名字与权限）",
  play: async ({
    canvasElement
  }) => {
    await openInviteDialog(canvasElement);
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  ...InviteDialog,
  name: "邀请成员弹框（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
    // 失败反馈以 Snackbar 的 alert 显示，标题不是 heading
    await expect(await body.findByRole("alert")).toHaveTextContent("邀请成员失败");
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "已添加但链接生成失败（部分成功）",
  args: {
    action: async () => ({
      error: "已添加「小明」，但邀请链接生成失败，请在列表中重新生成。",
      errorKey: "storybook-link-failed",
      operation: "invite"
    })
  },
  play: InviteFailed.play
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "邀请成功后在同一弹框显示链接与身份说明",
  args: {
    token: "storybook-invite-token"
  },
  play: async () => {
    // 模拟 Action 成功后的 fragment：新成员 ID 用于定位名字。
    window.history.replaceState(null, "", \`#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=\${placeholderMembers[1].id}\`);
    window.dispatchEvent(new Event("hashchange"));
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  ...CreatedLink,
  name: "邀请成功（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  ...BoundInviteCopyArea,
  name: "已生成链接：复制区域（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
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
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "普通成员只读（无邀请权限）",
  args: {
    canInvite: false,
    placeholderMemberActions: null
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  ...ReadOnly,
  name: "普通成员只读（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...I.parameters?.docs?.source}}},L=[`MemberList`,`MemberListMobile`,`Empty`,`InviteDialog`,`InviteDialogMobile`,`InviteFailed`,`LinkFailedPartially`,`CreatedLink`,`CreatedLinkMobile`,`BoundInviteCopyArea`,`BoundInviteCopyAreaMobile`,`RevokeConfirmation`,`RegenerateLink`,`ReadOnly`,`ReadOnlyMobile`]}))();export{j as BoundInviteCopyArea,M as BoundInviteCopyAreaMobile,k as CreatedLink,A as CreatedLinkMobile,w as Empty,T as InviteDialog,E as InviteDialogMobile,D as InviteFailed,O as LinkFailedPartially,S as MemberList,C as MemberListMobile,F as ReadOnly,I as ReadOnlyMobile,P as RegenerateLink,N as RevokeConfirmation,L as __namedExportsOrder,x as default};