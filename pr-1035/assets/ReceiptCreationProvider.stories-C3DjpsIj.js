import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./transactionStepFlowMessages-CMlMhzXo.js";import{a as r,i,r as a}from"./AccountStep-CuUC3VKV.js";import{n as o,r as s}from"./transactionStepFlow-jHa4zbU7.js";import{i as c,t as l}from"./transactionReceipt-CZYkeRDI.js";import{n as u,t as d}from"./NewTransactionStepFlow-No8Zj4QR.js";async function f({canvasElement:e}){await g.click(_(e.ownerDocument.body).getByRole(`button`,{name:`新增商家`}))}async function p({canvasElement:e}){let t=_(e.ownerDocument.body);await g.click(t.getAllByRole(`button`,{name:/^7-Eleven/})[0]),await g.click(await t.findByRole(`button`,{name:`更换支付账户 1`})),await g.click(await t.findByRole(`button`,{name:`新增账户`}))}async function m(e,t){t===`merchant`?await f(e):await p(e);let r=_(e.canvasElement.ownerDocument.body),i=await r.findByLabelText(t===`merchant`?/商家名称/:/账户名称/);await g.type(i,t===`merchant`?`全家`:`家庭现金`),t===`account`&&await g.click(r.getByRole(`radio`,{name:`现金`})),await g.click(r.getByRole(`button`,{name:t===`merchant`?`保存商家`:`保存账户`}));let a=await r.findByRole(`status`);await h(a).toHaveTextContent(t===`merchant`?n.merchantCreated(`全家`):n.accountCreated(`家庭现金`)),await h(a).toBeVisible(),await h(a.closest(`.MuiSnackbar-root`)?.parentElement).toBe(e.canvasElement.ownerDocument.body)}var h,g,_,v,y,b,x,S,C,w;e((()=>{t(),u(),a(),l(),s(),{expect:h,userEvent:g,within:_}=__STORYBOOK_MODULE_TEST__,v={title:`Organisms/Transactions/ReceiptCreationProvider`,component:d,decorators:[...r,i],args:{action:async()=>({}),accountOptions:o.accounts,addPresetsAction:async()=>({}),categoryOptions:c.categoryOptions,frequentMerchants:o.frequentMerchants,ledgerId:`ledger-1`,loadPresetsAction:async()=>({}),merchantOptions:o.merchants,merchantTags:o.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!1}},y={name:`全屏新增商家`,play:f},b={name:`全屏新增账户`,play:p},x={name:`新增商家后选中`,play:e=>m(e,`merchant`)},S={name:`新增账户后选中`,play:e=>m(e,`account`)},C={name:`全屏商家关闭时确认只覆盖当前层`,play:async e=>{await f(e);let t=_(e.canvasElement.ownerDocument.body);await g.type(await t.findByLabelText(/商家名称/),`商家草稿`),await g.click(t.getByRole(`button`,{name:n.creationClose}));let r=await t.findByRole(`dialog`,{name:`尚未保存`});await h(r).toBeVisible(),await h(r.closest(`.MuiDialog-root`)?.parentElement).toBe(e.canvasElement.ownerDocument.body)}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "全屏新增商家",
  play: openMerchant
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "全屏新增账户",
  play: openAccount
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "新增商家后选中",
  play: context => saveCreation(context, "merchant")
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "新增账户后选中",
  play: context => saveCreation(context, "account")
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w=[`MerchantDialog`,`AccountDialog`,`MerchantSaved`,`AccountSaved`,`MerchantUnsavedConfirmation`]}))();export{b as AccountDialog,S as AccountSaved,y as MerchantDialog,x as MerchantSaved,C as MerchantUnsavedConfirmation,w as __namedExportsOrder,v as default};