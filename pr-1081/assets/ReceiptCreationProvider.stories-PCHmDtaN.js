import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./transactionStepFlowMessages-BfwvcBq_.js";import{a as r,i,n as a,r as o}from"./transactionStepFlowStoryUtils-CyqK5uHq.js";import{n as s,r as c}from"./transactionStepFlow-jHa4zbU7.js";import{n as l,t as u}from"./NewTransactionStepFlow-DUTWjK5X.js";import{i as d,t as f}from"./transactionReceipt-BN12jKlD.js";async function p({canvasElement:e}){let t=await o(e);await _.click(await t.findByRole(`button`,{name:`新增商家`}))}async function m({canvasElement:e}){let t=await o(e);await _.click(await t.findByRole(`button`,{name:`7-Eleven`})),await _.click(await t.findByRole(`button`,{name:`添加付款账户`})),await _.click(await t.findByRole(`button`,{name:`新增账户`}))}async function h(e,t){t===`merchant`?await p(e):await m(e);let r=v(e.canvasElement.ownerDocument.body),i=await r.findByLabelText(t===`merchant`?/商家名称/:/账户名称/);await _.type(i,t===`merchant`?`全家`:`家庭现金`),t===`account`&&await _.click(r.getByRole(`radio`,{name:`现金`})),await _.click(r.getByRole(`button`,{name:t===`merchant`?`保存商家`:`保存账户`}));let a=await r.findByRole(`status`);await g(a).toHaveTextContent(t===`merchant`?n.merchantCreated(`全家`):n.accountCreated(`家庭现金`)),await g(a).toBeVisible(),await g(a.closest(`.MuiSnackbar-root`)?.parentElement).toBe(e.canvasElement.ownerDocument.body)}var g,_,v,y,b,x,S,C,w,T;e((()=>{t(),l(),a(),f(),c(),{expect:g,userEvent:_,within:v}=__STORYBOOK_MODULE_TEST__,y={title:`Organisms/Transactions/ReceiptCreationProvider`,component:u,decorators:[...r,i],args:{action:async()=>({}),accountOptions:s.accounts,addPresetsAction:async()=>({}),categoryOptions:d.categoryOptions,frequentMerchants:s.frequentMerchants,ledgerId:`ledger-1`,loadPresetsAction:async()=>({}),merchantOptions:s.merchants,merchantTags:s.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!1}},b={name:`全屏新增商家`,play:p},x={name:`全屏新增账户`,play:m},S={name:`新增商家后选中`,play:e=>h(e,`merchant`)},C={name:`新增账户后选中`,play:e=>h(e,`account`)},w={name:`全屏商家关闭时确认只覆盖当前层`,play:async e=>{await p(e);let t=v(e.canvasElement.ownerDocument.body);await _.type(await t.findByLabelText(/商家名称/),`商家草稿`),await _.click(t.getByRole(`button`,{name:n.creationClose}));let r=await t.findByRole(`dialog`,{name:`尚未保存`});await g(r).toBeVisible(),await g(r.closest(`.MuiDialog-root`)?.parentElement).toBe(e.canvasElement.ownerDocument.body)}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "全屏新增商家",
  play: openMerchant
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "全屏新增账户",
  play: openAccount
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "新增商家后选中",
  play: context => saveCreation(context, "merchant")
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "新增账户后选中",
  play: context => saveCreation(context, "account")
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "全屏商家关闭时确认只覆盖当前层",
  play: async context => {
    await openMerchant(context);
    const body = within(context.canvasElement.ownerDocument.body);
    await userEvent.type(await body.findByLabelText(/商家名称/), "商家草稿");
    await userEvent.click(body.getByRole("button", {
      name: m.creationClose
    }));
    const confirmation = await body.findByRole("dialog", {
      name: "尚未保存"
    });
    await expect(confirmation).toBeVisible();
    await expect(confirmation.closest(".MuiDialog-root")?.parentElement).toBe(context.canvasElement.ownerDocument.body);
  }
}`,...w.parameters?.docs?.source}}},T=[`MerchantDialog`,`AccountDialog`,`MerchantSaved`,`AccountSaved`,`MerchantUnsavedConfirmation`]}))();export{x as AccountDialog,C as AccountSaved,b as MerchantDialog,S as MerchantSaved,w as MerchantUnsavedConfirmation,T as __namedExportsOrder,y as default};