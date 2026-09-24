import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-CK176g4m.js";import{n as i,t as a}from"./ConfirmDialogProvider-c01AQdhs.js";import{i as o,n as s,r as c,t as l}from"./LedgerInviteEntry-SiBZrwTf.js";function u(e){return(0,f.jsx)(r,{storageScope:`storybook-ledger-invite-entry`,children:(0,f.jsx)(a,{children:(0,f.jsx)(c,{pendingInvites:e.canInvite?[_]:[],children:(0,f.jsx)(l,{...e})})})})}async function d(e){await p.click(await m(e).findByRole(`button`,{name:/^邀请成员/}))}var f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F;e((()=>{f=t(),i(),n(),s(),o(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h=async()=>({}),g=[{displayName:`奶奶`,id:`storybook-placeholder-1`},{displayName:`爷爷`,id:`storybook-placeholder-2`}],_={createdAt:`2026-09-01T09:30:00.000Z`,id:`storybook-bound-invite-id`,placeholderId:g[0].id,role:`member`,token:`storybook-bound-invite-token`},v={delete:async()=>({}),rename:async()=>({})},y={title:`Organisms/Ledgers/LedgerInviteEntry`,component:l,args:{action:h,canInvite:!0,ledgerId:`storybook-ledger`,ledgerName:`家庭账本`,placeholderMemberActions:v,placeholderMembers:g,token:null},render:u},b={name:`待邀请成员（已生成 / 未生成链接）与邀请成员入口`},x={...b,name:`待邀请成员列表（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},S={name:`暂无待邀请成员`,args:{placeholderMembers:[]}},C={name:`邀请成员弹框（填写名字与权限）`,play:async({canvasElement:e})=>{await d(e)}},w={...C,name:`邀请成员弹框（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},T={name:`邀请成员失败（同名）`,args:{action:async()=>({error:`已有同名待邀请成员，请在列表中为 TA 生成邀请链接。`,errorKey:`storybook-invite-failed`,operation:`invite`})},play:async({canvasElement:e})=>{await d(e);let t=m(document.body);await p.type(await t.findByLabelText(/名字/),`奶奶`),await p.click(await t.findByRole(`button`,{name:`生成邀请链接`})),await t.findByRole(`heading`,{name:`邀请成员失败`})}},E={name:`已添加但链接生成失败（部分成功）`,args:{action:async()=>({error:`已添加「小明」，但邀请链接生成失败，请在列表中重新生成。`,errorKey:`storybook-link-failed`,operation:`invite`})},play:T.play},D={name:`邀请成功后在同一弹框显示链接与身份说明`,args:{token:`storybook-invite-token`},play:async()=>{window.history.replaceState(null,``,`#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=${g[1].id}`),window.dispatchEvent(new Event(`hashchange`))}},O={...D,name:`邀请成功（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},k={name:`已生成链接：复制区域（身份说明）`,play:async({canvasElement:e})=>{await p.click(await m(e).findByRole(`button`,{name:`奶奶，等待加入`})),await p.click(await m(document.body).findByRole(`button`,{name:/查看邀请链接/}))}},A={...k,name:`已生成链接：复制区域（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},j={name:`撤销链接确认`,play:async e=>{await k.play?.(e);let t=m(document.body);await p.click(await t.findByRole(`button`,{name:`撤销邀请`})),await t.findByRole(`heading`,{name:`确认撤销邀请？`})}},M={name:`未生成链接（含撤销后）：重新生成`,play:async({canvasElement:e})=>{await p.click(await m(e).findByRole(`button`,{name:`爷爷，未生成链接`})),await p.click(await m(document.body).findByRole(`button`,{name:/生成专属邀请链接/}))}},N={name:`普通成员只读（无邀请权限）`,args:{canInvite:!1,placeholderMemberActions:null}},P={...N,name:`普通成员只读（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "待邀请成员（已生成 / 未生成链接）与邀请成员入口"
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  ...MemberList,
  name: "待邀请成员列表（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "暂无待邀请成员",
  args: {
    placeholderMembers: []
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "邀请成员弹框（填写名字与权限）",
  play: async ({
    canvasElement
  }) => {
    await openInviteDialog(canvasElement);
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  ...InviteDialog,
  name: "邀请成员弹框（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "邀请成员失败（同名）",
  args: {
    action: async () => ({
      error: "已有同名待邀请成员，请在列表中为 TA 生成邀请链接。",
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
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "已添加但链接生成失败（部分成功）",
  args: {
    action: async () => ({
      error: "已添加「小明」，但邀请链接生成失败，请在列表中重新生成。",
      errorKey: "storybook-link-failed",
      operation: "invite"
    })
  },
  play: InviteFailed.play
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "邀请成功后在同一弹框显示链接与身份说明",
  args: {
    token: "storybook-invite-token"
  },
  play: async () => {
    // 模拟 Action 成功后的 fragment：新成员 ID 用于定位名字。
    window.history.replaceState(null, "", \`#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=\${placeholderMembers[1].id}\`);
    window.dispatchEvent(new Event("hashchange"));
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  ...CreatedLink,
  name: "邀请成功（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  ...BoundInviteCopyArea,
  name: "已生成链接：复制区域（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "普通成员只读（无邀请权限）",
  args: {
    canInvite: false,
    placeholderMemberActions: null
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  ...ReadOnly,
  name: "普通成员只读（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...P.parameters?.docs?.source}}},F=[`MemberList`,`MemberListMobile`,`Empty`,`InviteDialog`,`InviteDialogMobile`,`InviteFailed`,`LinkFailedPartially`,`CreatedLink`,`CreatedLinkMobile`,`BoundInviteCopyArea`,`BoundInviteCopyAreaMobile`,`RevokeConfirmation`,`RegenerateLink`,`ReadOnly`,`ReadOnlyMobile`]}))();export{k as BoundInviteCopyArea,A as BoundInviteCopyAreaMobile,D as CreatedLink,O as CreatedLinkMobile,S as Empty,C as InviteDialog,w as InviteDialogMobile,T as InviteFailed,E as LinkFailedPartially,b as MemberList,x as MemberListMobile,N as ReadOnly,P as ReadOnlyMobile,M as RegenerateLink,j as RevokeConfirmation,F as __namedExportsOrder,y as default};