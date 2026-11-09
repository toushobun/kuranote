import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{a as n,r}from"./AccountStep-CO1myjtP.js";import{n as i,r as a}from"./transactionStepFlow-jHa4zbU7.js";import{a as o,o as s}from"./useReceiptMerchantPicker-BNBYmS1T.js";import{a as c,n as l,o as u,r as d,t as f}from"./transactionReceipt-DRjaQZwr.js";import{n as p,t as ee}from"./useTransactionForm-WxryLoLw.js";import{n as m,t as h}from"./TransactionStepFlow-E0puGpd1.js";function g({itemsOptions:e,note:t}){let n={items:e.initialItems??[],merchantId:`seven`,note:t,payments:e.initialPayments??[{accountId:`paypay`,amount:null}],transactionAt:``,type:`expense`},r=p({accountOptions:i.accounts,categoryOptions:e.categoryOptions,initialValues:n,merchantOptions:i.merchants});return(0,_.jsx)(o,{...e,readOnly:!0,form:r,accountOptions:i.accounts,amountItemId:null,onAmountItemChange:()=>{},action:()=>{},saving:!1,onMerchantClick:()=>{},onAccountSelect:()=>{}})}var _,v=e((()=>{_=t(),s(),ee(),a(),g.__docgenInfo={description:`只读小票（#962）的测试 / Storybook 外壳：已选 7-Eleven，明细与付款按参数预填。`,methods:[],displayName:`ReadOnlyReceipt`,props:{itemsOptions:{required:!0,tsType:{name:`ItemsStepOptions`},description:``},note:{required:!0,tsType:{name:`string`},description:``}}}}));async function y(e,t=`7-Eleven`){let n=w(e.ownerDocument.body);n.queryByRole(`textbox`,{name:`搜索商家`})&&(await C.click(n.getByRole(`button`,{name:t})),await n.findByRole(`button`,{name:`更换支付账户 1`}))}async function b(e,t){return await y(e),C.click(w(e.ownerDocument.body).getByRole(`button`,{name:t}))}var x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{x=t(),m(),r(),a(),v(),f(),{expect:S,userEvent:C,within:w}=__STORYBOOK_MODULE_TEST__,T={title:`Organisms/Transactions/TransactionConfirmStep`,component:h,decorators:n,args:{...i,...d,itemsOptions:{...d.itemsOptions,...l}},render:e=>(0,x.jsx)(h,{...e,itemsOptions:{...e.itemsOptions,categoryOptions:e.itemsOptions?.categoryOptions??[],initialPayments:e.itemsOptions?.initialPayments??d.itemsOptions?.initialPayments}}),play:({canvasElement:e})=>y(e),parameters:{viewport:{defaultViewport:`mobile2`}}},E={...l,initialPayments:[{accountId:``,amount:null}]},D={name:`自动明细待输入：名称与金额各有铅笔`,args:{suggestionsMerchantId:`seven`,suggestions:{...c,recommendedAccountIds:[`paypay`]},itemsOptions:l}},O={name:`只自动选付款账户：显示自动添加提示`,args:{...D.args,itemsOptions:E,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[`paypay`]}}},k={play:({canvasElement:e})=>y(e,`星巴克`),name:`第一次去的商家：选择收支账户（设计图 8 ③）`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]},itemsOptions:E}},A={name:`第一次去的商家：尝试保存后显示校验提示`,args:k.args,play:async({canvasElement:e})=>{await y(e,`星巴克`),await C.click(w(e.ownerDocument.body).getByRole(`button`,{name:`保存记账`}))}},j={name:`多账户已对上：可改账户与支付金额`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`2000`}],initialPayments:u}}},M={name:`多账户未对上（差额、保存时提示）`,args:{...j.args,itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`1500`}],initialPayments:u}}},N={name:`单账户：支付金额为纯文字`},P={name:`多组小计：长名称、大金额与仅大分类`,args:{itemsOptions:{...l,categoryOptions:[...l.categoryOptions,{id:`personal-care`,name:`🧴 洗护用品`,parentId:`daily`,parentName:`🛒 日用杂货`,type:`expense`},{id:`gifts`,name:`🎁 节日与人情往来礼品及伴手礼`,parentId:`social`,parentName:`🧧 人情往来`,type:`expense`},{id:`food`,name:`🍽️ 饮食`,parentId:null,parentName:null,type:`expense`}],initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`personal-care`,amount:`12345678`},{categoryId:`gifts`,amount:`12345678`},{categoryId:`points`,amount:`100`},{categoryId:`food`,amount:`1200`}]}}},F={name:`单组无小计，未选分类的明细排在分组之后`,args:{itemsOptions:{...l,initialItems:[{categoryId:``,amount:`200`},{categoryId:`lunch`,amount:`680`}]}}},I={name:`样式 ④：自动添加提示与多组间距（默认主题）`,args:{...D.args,suggestions:{...c,automaticCategoryIds:[`lunch`,`coffee`,`points`],recommendedAccountIds:[`paypay`]},itemsOptions:{...l,categoryOptions:l.categoryOptions.map(e=>e.id===`coffee`?{...e,parentId:`food`,parentName:`🍽️ 饮食`}:e)}}},L={...I,name:`样式 ④：自动添加提示与多组间距（樱花主题）`,parameters:{userTheme:{initialThemeKey:`sakuraStory`}}},R={name:`明细两排：首排名称与操作、次排待报销`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`1200`,specialStatus:`pendingReimbursement`},{categoryId:`points`,amount:`100`}]}}},z={name:`样式 ④：组内与组末都有次排时的间距`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`1200`,specialStatus:`pendingReimbursement`},{categoryId:`lunch`,amount:`800`},{categoryId:`storage`,amount:`12.55`},{categoryId:`points`,amount:`100`}]}}},B=[{categoryId:`lunch`,amount:`10000`,businessNetAmount:`5000`,refundedAmount:`3000`,reimbursementAmount:`2000`}],V={name:`被其他记录退款 / 报销：合计显示净额与已退款、已报销`,args:{itemsOptions:{...l,initialItems:B}}},H={name:`只读（#962）：没有铅笔、×、可点金额与保存按钮`,render:()=>(0,x.jsx)(g,{itemsOptions:{...l,initialItems:[...B,{categoryId:`points`,amount:`100`}]},note:`退了一部分，剩下的公司报销`})},U={name:`支付行铅笔：账户选择抽屉`,play:({canvasElement:e})=>b(e,`更换支付账户 1`)},W={name:`删除账户后重新选择：没有选中项`,play:async({canvasElement:e})=>{await b(e,`删除支付账户 1`),await b(e,`选择收支账户`)}},G={name:`换成不同币种的账户：确认框在抽屉之上`,play:async({canvasElement:e})=>{await b(e,`更换支付账户 1`),await C.click(await w(e.ownerDocument.body).findByRole(`radio`,{name:`招商银行卡 CNY`}))}},K={name:`明细两排：首排真实金额、次排小数位超出提示`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`12.55`},{categoryId:`storage`,amount:`2000`}]}}},q={name:`多账户：点金额打开金额键盘（输入中小票金额不变）`,args:M.args,play:async({canvasElement:e})=>{let t=w(e.ownerDocument.body);await b(e,`修改支付账户 2 金额：¥3,000`);let n=await t.findByLabelText(`金额计算器`);await C.click(w(n).getByRole(`button`,{name:`清空`})),await C.click(w(n).getByRole(`button`,{name:`5`})),await S(t.getByRole(`button`,{name:`修改支付账户 2 金额：¥3,000`,hidden:!0})).toBeInTheDocument()}},J={name:`编辑备注：自动聚焦且只显示抽屉标题`,play:async({canvasElement:e})=>{await b(e,/^修改备注：/),await C.type(w(e.ownerDocument.body).getByRole(`textbox`,{name:`备注`}),`和同事一起吃的午饭`)}},Y={name:`编辑时间（日期展开、时刻保留秒）`,play:({canvasElement:e})=>b(e,/^修改时间：/)},X={name:`保存失败`,args:{action:async()=>({error:`保存失败，请稍后重试。`})},play:({canvasElement:e})=>b(e,`保存记账`)},Z={name:`保存中`,args:{action:async()=>new Promise(()=>{})},play:X.play},Q={name:`小票修改后关闭确认（保存并退出）`,play:async({canvasElement:e})=>{await b(e,/^修改备注：/);let t=w(e.ownerDocument.body);await C.type(t.getByRole(`textbox`,{name:`备注`}),`临时备注`),await C.click(t.getByRole(`button`,{name:`完成`})),await C.click(await t.findByRole(`button`,{name:`关闭记账`}))}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "自动明细待输入：名称与金额各有铅笔",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: {
      ...receiptSuggestions,
      recommendedAccountIds: ["paypay"]
    },
    itemsOptions: receiptItemsOptions
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "只自动选付款账户：显示自动添加提示",
  args: {
    ...QuickEntry.args,
    itemsOptions: unselectedAccountItemsOptions,
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: ["paypay"]
    }
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  play: ({
    canvasElement
  }) => enterReceipt(canvasElement, "星巴克"),
  name: "第一次去的商家：选择收支账户（设计图 8 ③）",
  args: {
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: []
    },
    itemsOptions: unselectedAccountItemsOptions
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "第一次去的商家：尝试保存后显示校验提示",
  args: FirstVisit.args,
  play: async ({
    canvasElement
  }) => {
    await enterReceipt(canvasElement, "星巴克");
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "保存记账"
    }));
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "多账户已对上：可改账户与支付金额",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "8000"
      }, {
        categoryId: "storage",
        amount: "2000"
      }],
      initialPayments: twoPayments
    }
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "多账户未对上（差额、保存时提示）",
  args: {
    ...MultiAccountBalanced.args,
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "8000"
      }, {
        categoryId: "storage",
        amount: "1500"
      }],
      initialPayments: twoPayments
    }
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "单账户：支付金额为纯文字"
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "多组小计：长名称、大金额与仅大分类",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      categoryOptions: [...receiptItemsOptions.categoryOptions, {
        id: "personal-care",
        name: "🧴 洗护用品",
        parentId: "daily",
        parentName: "🛒 日用杂货",
        type: "expense"
      }, {
        id: "gifts",
        name: "🎁 节日与人情往来礼品及伴手礼",
        parentId: "social",
        parentName: "🧧 人情往来",
        type: "expense"
      }, {
        id: "food",
        name: "🍽️ 饮食",
        parentId: null,
        parentName: null,
        type: "expense"
      }],
      initialItems: [{
        categoryId: "lunch",
        amount: "8000"
      }, {
        categoryId: "personal-care",
        amount: "12345678"
      }, {
        categoryId: "gifts",
        amount: "12345678"
      }, {
        categoryId: "points",
        amount: "100"
      }, {
        categoryId: "food",
        amount: "1200"
      }]
    }
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "单组无小计，未选分类的明细排在分组之后",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "",
        amount: "200"
      }, {
        categoryId: "lunch",
        amount: "680"
      }]
    }
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "样式 ④：自动添加提示与多组间距（默认主题）",
  args: {
    ...QuickEntry.args,
    suggestions: {
      ...receiptSuggestions,
      automaticCategoryIds: ["lunch", "coffee", "points"],
      recommendedAccountIds: ["paypay"]
    },
    itemsOptions: {
      ...receiptItemsOptions,
      categoryOptions: receiptItemsOptions.categoryOptions.map(category => category.id === "coffee" ? {
        ...category,
        parentId: "food",
        parentName: "🍽️ 饮食"
      } : category)
    }
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  ...GroupedWithAutomaticNotice,
  name: "样式 ④：自动添加提示与多组间距（樱花主题）",
  parameters: {
    userTheme: {
      initialThemeKey: "sakuraStory"
    }
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "明细两排：首排名称与操作、次排待报销",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "1200",
        specialStatus: "pendingReimbursement"
      }, {
        categoryId: "points",
        amount: "100"
      }]
    }
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "样式 ④：组内与组末都有次排时的间距",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "1200",
        specialStatus: "pendingReimbursement"
      }, {
        categoryId: "lunch",
        amount: "800"
      }, {
        categoryId: "storage",
        amount: "12.55"
      }, {
        categoryId: "points",
        amount: "100"
      }]
    }
  }
}`,...z.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "被其他记录退款 / 报销：合计显示净额与已退款、已报销",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: offsetItems
    }
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "只读（#962）：没有铅笔、×、可点金额与保存按钮",
  render: () => <ReadOnlyReceipt itemsOptions={{
    ...receiptItemsOptions,
    initialItems: [...offsetItems, {
      categoryId: "points",
      amount: "100"
    }]
  }} note="退了一部分，剩下的公司报销" />
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "支付行铅笔：账户选择抽屉",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "更换支付账户 1")
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "删除账户后重新选择：没有选中项",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, "删除支付账户 1");
    await clickButton(canvasElement, "选择收支账户");
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "换成不同币种的账户：确认框在抽屉之上",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, "更换支付账户 1");
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("radio", {
      name: "招商银行卡 CNY"
    }));
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "明细两排：首排真实金额、次排小数位超出提示",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      // ฿12.55 换成 JPY 账户后金额不换算，保留 12.55。
      initialItems: [{
        categoryId: "lunch",
        amount: "12.55"
      }, {
        categoryId: "storage",
        amount: "2000"
      }]
    }
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "多账户：点金额打开金额键盘（输入中小票金额不变）",
  args: MultiAccountUnbalanced.args,
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await clickButton(canvasElement, "修改支付账户 2 金额：¥3,000");
    const keypad = await body.findByLabelText("金额计算器");
    await userEvent.click(within(keypad).getByRole("button", {
      name: "清空"
    }));
    await userEvent.click(within(keypad).getByRole("button", {
      name: "5"
    }));
    // 键盘里只是草稿，点「确定」前小票上的金额不变。
    await expect(body.getByRole("button", {
      name: "修改支付账户 2 金额：¥3,000",
      hidden: true
    })).toBeInTheDocument();
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "编辑备注：自动聚焦且只显示抽屉标题",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, /^修改备注：/);
    await userEvent.type(within(canvasElement.ownerDocument.body).getByRole("textbox", {
      name: "备注"
    }), "和同事一起吃的午饭");
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "编辑时间（日期展开、时刻保留秒）",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, /^修改时间：/)
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "保存失败",
  args: {
    action: async () => ({
      error: "保存失败，请稍后重试。"
    })
  },
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "保存记账")
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    action: async () => new Promise(() => {})
  },
  play: SaveError.play
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "小票修改后关闭确认（保存并退出）",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, /^修改备注：/);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(body.getByRole("textbox", {
      name: "备注"
    }), "临时备注");
    await userEvent.click(body.getByRole("button", {
      name: "完成"
    }));
    await userEvent.click(await body.findByRole("button", {
      name: "关闭记账"
    }));
  }
}`,...Q.parameters?.docs?.source}}},$=[`QuickEntry`,`AutomaticAccountOnly`,`FirstVisit`,`FirstVisitAfterSave`,`MultiAccountBalanced`,`MultiAccountUnbalanced`,`SingleAccount`,`GroupedCategories`,`SingleCategory`,`GroupedWithAutomaticNotice`,`GroupedWithAutomaticNoticeSakura`,`ItemTags`,`GroupedSublines`,`OffsetNetTotal`,`ReadOnly`,`AccountPicker`,`AccountPickerAfterRemoval`,`CurrencyConfirm`,`ExcessDecimals`,`PaymentAmountKeypad`,`NoteEditor`,`TimeEditor`,`SaveError`,`Saving`,`Abandon`]}))();export{Q as Abandon,U as AccountPicker,W as AccountPickerAfterRemoval,O as AutomaticAccountOnly,G as CurrencyConfirm,K as ExcessDecimals,k as FirstVisit,A as FirstVisitAfterSave,P as GroupedCategories,z as GroupedSublines,I as GroupedWithAutomaticNotice,L as GroupedWithAutomaticNoticeSakura,R as ItemTags,j as MultiAccountBalanced,M as MultiAccountUnbalanced,J as NoteEditor,V as OffsetNetTotal,q as PaymentAmountKeypad,D as QuickEntry,H as ReadOnly,X as SaveError,Z as Saving,N as SingleAccount,F as SingleCategory,Y as TimeEditor,$ as __namedExportsOrder,T as default};