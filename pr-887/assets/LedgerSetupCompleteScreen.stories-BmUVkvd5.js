import{i as e}from"./preload-helper-D2yxXLVK.js";import{r as t,t as n}from"./ledgerSetup-FkC1q1tT.js";import{a as r,c as i,i as a,n as o,o as s,r as c}from"./ledgerSetupWizardStoryUtils-CT_nifmj.js";async function l(e){let t=d(e.ownerDocument.body);await u.click(await t.findByRole(`button`,{name:`完成创建`})),await t.findByRole(`button`,{name:/^邀请成员/}),await u.click(t.getByRole(`button`,{name:`完成`})),await t.findByRole(`heading`,{name:`一切就绪！`})}var u,d,f,p,m,h,g,_;e((()=>{i(),c(),t(),{userEvent:u,within:d}=__STORYBOOK_MODULE_TEST__,f=n(),p=n({accounts:{items:[],skipped:!0}}),m={title:`Organisms/Ledgers/LedgerSetupCompleteScreen`,component:s,decorators:r,args:{actions:o(f,{inviteMembers:{pendingInvites:[],placeholderMembers:[{displayName:`奶奶`,id:`placeholder-1`}]}}),...a,progress:f},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>l(e)},h={name:`全部有数字`},g={name:`部分为 0（账户已跳过、无待邀请成员）`,args:{actions:o(p),progress:p}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "全部有数字"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "部分为 0（账户已跳过、无待邀请成员）",
  args: {
    actions: createLedgerSetupWizardStoryActions(partlyEmptyProgress),
    progress: partlyEmptyProgress
  }
}`,...g.parameters?.docs?.source}}},_=[`AllStats`,`PartlyZero`]}))();export{h as AllStats,g as PartlyZero,_ as __namedExportsOrder,m as default};