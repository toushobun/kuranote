import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,i as n,n as r,r as i}from"./transactionStepFlowStoryUtils-B54pm877.js";import{n as a,r as o}from"./transactionStepFlow-CBFmsXNX.js";import{n as s,t as c}from"./transactionLinkCandidateFixtures-CqxUfYhM.js";import{n as l,t as u}from"./NewTransactionStepFlow-Dx4Z1z4h.js";import{i as d,t as f}from"./transactionReceipt-B6hjfHUz.js";var p,m,h=e((()=>{s(),f(),p={kind:`refund`,merchantId:`seven`,accountId:`paypay`,candidates:c.slice(0,2).map((e,t)=>({...e,id:`source-item-${t}`,accountId:`paypay`,merchantId:`seven`,merchantName:`7-Eleven`,transactionRecordId:`source-record`,categoryName:t===0?`旧午餐`:`旧咖啡`}))},m={...d,categoryOptions:[...d.categoryOptions,{id:`system-refund`,name:`退款`,parentId:`income`,parentName:`收入`,type:`income`,systemKey:`refund`},{id:`system-reimbursement`,name:`报销`,parentId:`income`,parentName:`收入`,type:`income`,systemKey:`reimbursement`}]}})),g,_,v,y,b,x,S,C,w,T,E,D;e((()=>{h(),r(),f(),o(),l(),{expect:g,userEvent:_,within:v}=__STORYBOOK_MODULE_TEST__,y={title:`Templates/Transactions/NewTransactionStepFlow`,component:u,decorators:[...t,n],args:{action:async()=>({}),accountOptions:a.accounts,addPresetsAction:async()=>({}),categoryOptions:d.categoryOptions,frequentMerchants:a.frequentMerchants,ledgerId:`ledger-1`,loadPresetsAction:async()=>({}),merchantOptions:a.merchants,merchantTags:a.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!1},parameters:{viewport:{defaultViewport:`mobile2`}}},b={name:`从商家记账（打开即空小票）`},x={name:`常用商家为空（含获取失败）`,args:{frequentMerchants:[]},play:async({canvasElement:e})=>{await i(e)}},S={name:`无记录商家（直接显示空小票）`,play:async({canvasElement:e})=>{let t=await i(e),n=await t.findByRole(`button`,{name:`新开商家`});await _.click(n);let r=await t.findByRole(`button`,{name:`添加明细`}),a=t.queryByText(`正在按习惯准备明细…`),o=t.queryByText(`正在读取常用账户…`);await g(r).toBeVisible(),await g(a).not.toBeInTheDocument(),await g(o).not.toBeInTheDocument()}},C={name:`账户周转（同一外框，可切回从商家记账）`,args:{initialMethod:`transfer`}},w={name:`切换方式后保留草稿`,play:async({canvasElement:e})=>{let t=v(e.ownerDocument.body),n=async e=>_.click(await t.findByRole(`button`,{name:e}));await n(`修改备注：添加备注`),await _.type(await t.findByRole(`textbox`,{name:`备注`}),`周末采购`),await n(`完成`),await n(`切换方式`),await n(`账户周转`),await n(`切换方式`),await n(`从商家记账`),await g(await t.findByRole(`button`,{name:`修改备注：周末采购`})).toBeVisible()}},T={name:`从旧记录退款：单明细与来源提示`,args:{offsetEntry:{...p,candidates:[p.candidates[0]]},categoryOptions:m.categoryOptions,transactionItemSpecialStatusEnabled:!0}},E={name:`从旧记录退款：多明细自动打开现有抽屉`,args:{offsetEntry:p,categoryOptions:m.categoryOptions,transactionItemSpecialStatusEnabled:!0}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "从商家记账（打开即空小票）"
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "常用商家为空（含获取失败）",
  args: {
    frequentMerchants: []
  },
  play: async ({
    canvasElement
  }) => {
    await openMerchantStoryDrawer(canvasElement);
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "无记录商家（直接显示空小票）",
  play: async ({
    canvasElement
  }) => {
    const body = await openMerchantStoryDrawer(canvasElement);
    const merchant = await body.findByRole("button", {
      name: "新开商家"
    });
    await userEvent.click(merchant);
    const addItem = await body.findByRole("button", {
      name: "添加明细"
    });
    const itemsLoading = body.queryByText("正在按习惯准备明细…");
    const paymentsLoading = body.queryByText("正在读取常用账户…");
    await expect(addItem).toBeVisible();
    await expect(itemsLoading).not.toBeInTheDocument();
    await expect(paymentsLoading).not.toBeInTheDocument();
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "账户周转（同一外框，可切回从商家记账）",
  args: {
    initialMethod: "transfer"
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "切换方式后保留草稿",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    const click = async (name: string) => userEvent.click(await body.findByRole("button", {
      name
    }));
    await click("修改备注：添加备注");
    await userEvent.type(await body.findByRole("textbox", {
      name: "备注"
    }), "周末采购");
    await click("完成");
    await click("切换方式");
    await click("账户周转");
    await click("切换方式");
    await click("从商家记账");
    await expect(await body.findByRole("button", {
      name: "修改备注：周末采购"
    })).toBeVisible();
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "从旧记录退款：单明细与来源提示",
  args: {
    offsetEntry: {
      ...offsetEntry,
      candidates: [offsetEntry.candidates[0]]
    },
    categoryOptions: offsetItemsOptions.categoryOptions,
    transactionItemSpecialStatusEnabled: true
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "从旧记录退款：多明细自动打开现有抽屉",
  args: {
    offsetEntry,
    categoryOptions: offsetItemsOptions.categoryOptions,
    transactionItemSpecialStatusEnabled: true
  }
}`,...E.parameters?.docs?.source}}},D=[`Default`,`NoFrequentMerchants`,`NewMerchantWithoutHistory`,`Transfer`,`RetainedDrafts`,`OffsetSingle`,`OffsetMultiple`]}))();export{b as Default,S as NewMerchantWithoutHistory,x as NoFrequentMerchants,E as OffsetMultiple,T as OffsetSingle,w as RetainedDrafts,C as Transfer,D as __namedExportsOrder,y as default};