import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./transactionStepFlowStoryUtils-UvTmnG5p.js";import{n as r,r as i}from"./transactionStepFlow-BHATPliy.js";import{n as a,t as o}from"./TransactionStepFlow-DbOR-qi2.js";import{i as s,n as c,r as l,t as u}from"./transactionItemsStep-nGPALZaj.js";var d,f=e((()=>{i(),c(),d={...r,initialStep:4,initialMerchantId:`seven`,initialAccountId:`paypay`,itemsOptions:{...l,initialItems:u},action:async()=>({})}})),p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{a(),n(),f(),c(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Transactions/TransactionConfirmStep`,component:o,decorators:t,args:d,parameters:{viewport:{defaultViewport:`mobile2`}}},g={name:`确认（可保存、空备注）`},_={name:`编辑备注`,play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(t.getByRole(`button`,{name:/^备注 /})),await p.type(t.getByRole(`textbox`,{name:`备注`}),`和同事一起吃的午饭`)}},v={name:`编辑时间（日期展开、时刻保留秒）`,play:async({canvasElement:e})=>{await p.click(m(e.ownerDocument.body).getByRole(`button`,{name:/^时间 /}))}},y={name:`还有未填金额（提示、标红、禁用保存）`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`498`},{categoryId:`coffee`,amount:``}]}}},b={name:`缺少商家、账户和明细`,args:{initialMerchantId:void 0,initialAccountId:void 0,itemsOptions:{categoryOptions:l.categoryOptions}}},x={name:`多账户未对上`,args:{itemsOptions:{...l,initialPayments:s,initialItems:[{categoryId:`lunch`,amount:`498`}]}}},S={name:`保存失败`,args:{action:async()=>({error:`保存失败，请稍后重试。`})},play:async({canvasElement:e})=>{await p.click(m(e.ownerDocument.body).getByRole(`button`,{name:`保存记账`}))}},C={name:`保存中`,args:{action:async()=>new Promise(()=>{})},play:S.play},w={name:`确认页关闭时确认`,play:async({canvasElement:e})=>{await p.click(m(e.ownerDocument.body).getByRole(`button`,{name:`关闭记账`}))}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "确认（可保存、空备注）"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "编辑备注",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", {
      name: /^备注 /
    }));
    await userEvent.type(body.getByRole("textbox", {
      name: "备注"
    }), "和同事一起吃的午饭");
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "编辑时间（日期展开、时刻保留秒）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: /^时间 /
    }));
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "还有未填金额（提示、标红、禁用保存）",
  args: {
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: [{
        categoryId: "lunch",
        amount: "498"
      }, {
        categoryId: "coffee",
        amount: ""
      }]
    }
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "缺少商家、账户和明细",
  args: {
    initialMerchantId: undefined,
    initialAccountId: undefined,
    itemsOptions: {
      categoryOptions: itemsStepFixture.categoryOptions
    }
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "多账户未对上",
  args: {
    itemsOptions: {
      ...itemsStepFixture,
      initialPayments: twoPayments,
      initialItems: [{
        categoryId: "lunch",
        amount: "498"
      }]
    }
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "保存失败",
  args: {
    action: async () => ({
      error: "保存失败，请稍后重试。"
    })
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "保存记账"
    }));
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    action: async () => new Promise(() => {})
  },
  play: SaveError.play
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "确认页关闭时确认",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "关闭记账"
    }));
  }
}`,...w.parameters?.docs?.source}}},T=[`Ready`,`NoteEditor`,`TimeEditor`,`MissingAmount`,`MissingRequired`,`Unbalanced`,`SaveError`,`Saving`,`Abandon`]}))();export{w as Abandon,y as MissingAmount,b as MissingRequired,_ as NoteEditor,g as Ready,S as SaveError,C as Saving,v as TimeEditor,x as Unbalanced,T as __namedExportsOrder,h as default};