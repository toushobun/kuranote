import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,i as n,n as r,r as i}from"./transactionStepFlowStoryUtils-Vdt3izJV.js";import{n as a,r as o}from"./transactionStepFlow-BdbS7D1i.js";import{n as s,t as c}from"./NewTransactionStepFlow-BC_AD_6R.js";import{i as l,t as u}from"./transactionReceipt-BN12jKlD.js";var d,f,p,m,h,g,_,v,y,b;e((()=>{r(),u(),o(),s(),{expect:d,userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m={title:`Templates/Transactions/NewTransactionStepFlow`,component:c,decorators:[...t,n],args:{action:async()=>({}),accountOptions:a.accounts,addPresetsAction:async()=>({}),categoryOptions:l.categoryOptions,frequentMerchants:a.frequentMerchants,ledgerId:`ledger-1`,loadPresetsAction:async()=>({}),merchantOptions:a.merchants,merchantTags:a.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!1},parameters:{viewport:{defaultViewport:`mobile2`}}},h={name:`从商家记账（打开即空小票）`},g={name:`常用商家为空（含获取失败）`,args:{frequentMerchants:[]},play:async({canvasElement:e})=>{await i(e)}},_={name:`无记录商家（直接显示空小票）`,play:async({canvasElement:e})=>{let t=await i(e),n=await t.findByRole(`button`,{name:`新开商家`});await f.click(n);let r=await t.findByRole(`button`,{name:`添加明细`}),a=t.queryByText(`正在按习惯准备明细…`),o=t.queryByText(`正在读取常用账户…`);await d(r).toBeVisible(),await d(a).not.toBeInTheDocument(),await d(o).not.toBeInTheDocument()}},v={name:`账户周转（同一外框，可切回从商家记账）`,args:{initialMethod:`transfer`}},y={name:`切换方式后保留草稿`,play:async({canvasElement:e})=>{let t=p(e.ownerDocument.body),n=async e=>f.click(await t.findByRole(`button`,{name:e}));await n(`修改备注：添加备注`),await f.type(await t.findByRole(`textbox`,{name:`备注`}),`周末采购`),await n(`完成`),await n(`切换方式`),await n(`账户周转`),await n(`切换方式`),await n(`从商家记账`),await d(await t.findByRole(`button`,{name:`修改备注：周末采购`})).toBeVisible()}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "从商家记账（打开即空小票）"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "常用商家为空（含获取失败）",
  args: {
    frequentMerchants: []
  },
  play: async ({
    canvasElement
  }) => {
    await openMerchantStoryDrawer(canvasElement);
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "账户周转（同一外框，可切回从商家记账）",
  args: {
    initialMethod: "transfer"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b=[`Default`,`NoFrequentMerchants`,`NewMerchantWithoutHistory`,`Transfer`,`RetainedDrafts`]}))();export{h as Default,_ as NewMerchantWithoutHistory,g as NoFrequentMerchants,y as RetainedDrafts,v as Transfer,b as __namedExportsOrder,m as default};