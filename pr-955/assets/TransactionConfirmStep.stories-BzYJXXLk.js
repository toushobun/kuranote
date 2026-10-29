import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./transactionStepFlowStoryUtils-Dv3X4aJQ.js";import{n as r,r as i}from"./transactionStepFlow-DP1iBwKn.js";import{n as a,t as o}from"./TransactionStepFlow-DZ6WXdq7.js";import{i as s,n as c,r as l,t as u}from"./transactionItemsStep-8KYhgmKk.js";var d,f=e((()=>{i(),c(),d={...r,initialStep:4,initialMerchantId:`seven`,initialAccountId:`paypay`,itemsOptions:{...l,initialItems:u},action:async()=>({})}})),p,m,h,g,_,v,y,b,x,S,C,w,T,E;e((()=>{a(),n(),f(),c(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Transactions/TransactionConfirmStep`,component:o,decorators:t,args:d,parameters:{viewport:{defaultViewport:`mobile2`}}},g={name:`小票（单账户、空备注）`},_={name:`小票（多账户 + 备注）`,args:{itemsOptions:{...l,initialItems:u,initialPayments:s}},play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(t.getByRole(`button`,{name:/^修改备注：/})),await p.type(t.getByRole(`textbox`,{name:`备注`}),`给书房换的新键盘`),await p.click(t.getByRole(`button`,{name:`完成`}))}},v={name:`编辑备注`,play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(t.getByRole(`button`,{name:/^修改备注：/})),await p.type(t.getByRole(`textbox`,{name:`备注`}),`和同事一起吃的午饭`)}},y={name:`编辑时间（日期展开、时刻保留秒）`,play:async({canvasElement:e})=>{await p.click(m(e.ownerDocument.body).getByRole(`button`,{name:/^修改时间：/}))}},b={name:`未完成项：还有未填金额（提示、标红、禁用保存）`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`498`},{categoryId:`coffee`,amount:``}]}}},x={name:`未完成项：缺少商家、账户和明细`,args:{initialMerchantId:void 0,initialAccountId:void 0,itemsOptions:{categoryOptions:l.categoryOptions}}},S={name:`未完成项：多账户未对上`,args:{itemsOptions:{...l,initialPayments:s,initialItems:[{categoryId:`lunch`,amount:`498`}]}}},C={name:`保存失败`,args:{action:async()=>({error:`保存失败，请稍后重试。`})},play:async({canvasElement:e})=>{await p.click(m(e.ownerDocument.body).getByRole(`button`,{name:`保存记账`}))}},w={name:`保存中`,args:{action:async()=>new Promise(()=>{})},play:C.play},T={name:`确认页关闭时确认`,play:async({canvasElement:e})=>{await p.click(m(e.ownerDocument.body).getByRole(`button`,{name:`关闭记账`}))}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "小票（单账户、空备注）"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "小票（多账户 + 备注）",
  args: {
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: filledItems,
      initialPayments: twoPayments
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", {
      name: /^修改备注：/
    }));
    await userEvent.type(body.getByRole("textbox", {
      name: "备注"
    }), "给书房换的新键盘");
    await userEvent.click(body.getByRole("button", {
      name: "完成"
    }));
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "编辑备注",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", {
      name: /^修改备注：/
    }));
    await userEvent.type(body.getByRole("textbox", {
      name: "备注"
    }), "和同事一起吃的午饭");
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "编辑时间（日期展开、时刻保留秒）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: /^修改时间：/
    }));
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "未完成项：还有未填金额（提示、标红、禁用保存）",
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "未完成项：缺少商家、账户和明细",
  args: {
    initialMerchantId: undefined,
    initialAccountId: undefined,
    itemsOptions: {
      categoryOptions: itemsStepFixture.categoryOptions
    }
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "未完成项：多账户未对上",
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
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    action: async () => new Promise(() => {})
  },
  play: SaveError.play
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "确认页关闭时确认",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "关闭记账"
    }));
  }
}`,...T.parameters?.docs?.source}}},E=[`Ready`,`MultiAccountWithNote`,`NoteEditor`,`TimeEditor`,`MissingAmount`,`MissingRequired`,`Unbalanced`,`SaveError`,`Saving`,`Abandon`]}))();export{T as Abandon,b as MissingAmount,x as MissingRequired,_ as MultiAccountWithNote,v as NoteEditor,g as Ready,C as SaveError,w as Saving,y as TimeEditor,S as Unbalanced,E as __namedExportsOrder,h as default};