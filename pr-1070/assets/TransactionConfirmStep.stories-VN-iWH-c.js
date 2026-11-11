import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{a as n,n as r,r as ee,t as te}from"./transactionStepFlowStoryUtils-DOhyRy8R.js";import{n as i,r as a}from"./transactionStepFlow-jHa4zbU7.js";import{a as ne,c as re,o as ie,s as ae}from"./useReceiptMerchantPicker-SuKqkpyN.js";import{n as oe,t as o}from"./TransactionStepFlow-DzzFV2Fw.js";import{a as s,n as c,o as l,r as u,t as se}from"./transactionReceipt-BN12jKlD.js";function d({itemsOptions:e,note:t}){let n={items:e.initialItems??[],merchantId:`seven`,note:t,payments:e.initialPayments??[{accountId:`paypay`,amount:null}],transactionAt:``,type:`expense`},r=ie({accountOptions:i.accounts,categoryOptions:e.categoryOptions,initialValues:n,merchantOptions:i.merchants});return(0,f.jsx)(ae,{...e,readOnly:!0,form:r,accountOptions:i.accounts,amountItemId:null,onAmountItemChange:()=>{},action:()=>{},saving:!1,onMerchantClick:()=>{},onAccountSelect:()=>{}})}var f,ce=e((()=>{f=t(),re(),ne(),a(),d.__docgenInfo={description:`只读小票（#962）的测试 / Storybook 外壳：已选 7-Eleven，明细与付款按参数预填。`,methods:[],displayName:`ReadOnlyReceipt`,props:{itemsOptions:{required:!0,tsType:{name:`ItemsStepOptions`},description:``},note:{required:!0,tsType:{name:`string`},description:``}}}}));async function p(e,t=`7-Eleven`){let n=v(e.ownerDocument.body);n.queryByRole(`button`,{name:`修改商家：请选择商家`})&&(await ee(e),await _.click(n.getByRole(`button`,{name:t})),await n.findByRole(`button`,{name:`保存记账`}))}async function m(e,t){return await p(e),_.click(v(e.ownerDocument.body).getByRole(`button`,{name:t}))}var h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{h=t(),oe(),r(),a(),ce(),se(),{expect:g,userEvent:_,within:v}=__STORYBOOK_MODULE_TEST__,y={title:`Organisms/Transactions/TransactionConfirmStep`,component:o,decorators:n,args:{...i,...u,itemsOptions:{...u.itemsOptions,...c}},render:e=>(0,h.jsx)(o,{...e,itemsOptions:{...e.itemsOptions,categoryOptions:e.itemsOptions?.categoryOptions??[],initialPayments:e.itemsOptions?.initialPayments??u.itemsOptions?.initialPayments}}),play:({canvasElement:e})=>p(e),parameters:{viewport:{defaultViewport:`mobile2`}}},b={...c,initialPayments:[{accountId:``,amount:null}]},x={name:`首次选商家：明细与付款账户读取中`,args:{itemsOptions:{...b,initialItems:[]},suggestionsMerchantId:`coffee`,suggestions:void 0},play:async({canvasElement:e})=>{await p(e),await te(e)}},S={name:`自动明细待输入：名称与金额各有铅笔`,args:{suggestionsMerchantId:`seven`,suggestions:{...s,recommendedAccountIds:[`paypay`]},itemsOptions:c}},C={name:`只自动选付款账户：显示自动添加提示`,args:{...S.args,itemsOptions:b,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[`paypay`]}}},w={play:({canvasElement:e})=>p(e,`星巴克`),name:`第一次去的商家：添加付款账户`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]},itemsOptions:b}},T={name:`第一次去的商家：尝试保存后显示校验提示`,args:w.args,play:async({canvasElement:e})=>{await p(e,`星巴克`),await _.click(v(e.ownerDocument.body).getByRole(`button`,{name:`保存记账`}))}},E={name:`多账户已对上：可改账户与支付金额`,args:{itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`2000`}],initialPayments:l}}},D={name:`纯收入：多账户收款已对上`,args:{itemsOptions:{...c,initialItems:[{categoryId:`points`,amount:`10000`}],initialPayments:l}}},O={...D,name:`纯收入多账户：新增明细默认选中收入分类`,play:async({canvasElement:e})=>{await m(e,`添加明细`),await g(await v(e.ownerDocument.body).findByRole(`button`,{name:/积分返还/,pressed:!0})).toBeInTheDocument()}},k={...E,name:`新增明细：切换大分类后选中第一个小分类`,play:async({canvasElement:e})=>{await m(e,`添加明细`);let t=v(e.ownerDocument.body);await _.click(await t.findByRole(`button`,{name:/日用品/})),await g(await t.findByRole(`button`,{name:/收纳/,pressed:!0})).toBeInTheDocument()}},A={name:`收支混合：只允许一个账户`,args:{itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`points`,amount:`100`}]}}},j={name:`多账户：添加付款账户抽屉`,args:{...E.args,suggestionsMerchantId:`seven`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[`paypay`,`cash`]}},play:async({canvasElement:e})=>{await m(e,`添加付款账户`);let t=v(await v(e.ownerDocument.body).findByRole(`radiogroup`,{name:`收支账户`}));await g(t.getByRole(`radio`,{name:`乐天银行 JPY`})).toBeInTheDocument(),await g(t.queryByRole(`alert`)).not.toBeInTheDocument()}},M={name:`多账户未对上（差额、保存时提示）`,args:{...E.args,itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`1500`}],initialPayments:l}}},N={name:`单账户：支付金额为纯文字`},P={name:`多组小计：长名称、大金额与仅大分类`,args:{itemsOptions:{...c,categoryOptions:[...c.categoryOptions,{id:`personal-care`,name:`🧴 洗护用品`,parentId:`daily`,parentName:`🛒 日用杂货`,type:`expense`},{id:`gifts`,name:`🎁 节日与人情往来礼品及伴手礼`,parentId:`social`,parentName:`🧧 人情往来`,type:`expense`},{id:`food`,name:`🍽️ 饮食`,parentId:null,parentName:null,type:`expense`}],initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`personal-care`,amount:`12345678`},{categoryId:`gifts`,amount:`12345678`},{categoryId:`points`,amount:`100`},{categoryId:`food`,amount:`1200`}]}}},F={name:`单组无小计，未选分类的明细排在分组之后`,args:{itemsOptions:{...c,initialItems:[{categoryId:``,amount:`200`},{categoryId:`lunch`,amount:`680`}]}}},I={name:`样式 ④：自动添加提示与多组间距（默认主题）`,args:{...S.args,suggestions:{...s,automaticCategoryIds:[`lunch`,`coffee`,`points`],recommendedAccountIds:[`paypay`]},itemsOptions:{...c,categoryOptions:c.categoryOptions.map(e=>e.id===`coffee`?{...e,parentId:`food`,parentName:`🍽️ 饮食`}:e)}}},L={...I,name:`样式 ④：自动添加提示与多组间距（樱花主题）`,parameters:{userTheme:{initialThemeKey:`sakuraStory`}}},R={name:`待报销明细与收支混合的单账户说明`,args:{itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`1200`,specialStatus:`pendingReimbursement`},{categoryId:`points`,amount:`100`}]}}},z={name:`样式 ④：组内与组末都有次排时的间距`,args:{itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`1200`,specialStatus:`pendingReimbursement`},{categoryId:`lunch`,amount:`800`},{categoryId:`storage`,amount:`12.55`},{categoryId:`points`,amount:`100`}]}}},B=[{categoryId:`lunch`,amount:`10000`,businessNetAmount:`5000`,refundedAmount:`3000`,reimbursementAmount:`2000`}],V={name:`被其他记录退款 / 报销：合计显示净额与已退款、已报销`,args:{itemsOptions:{...c,initialItems:B}}},H={name:`只读（#962）：没有铅笔、×、可点金额与保存按钮`,render:()=>(0,h.jsx)(d,{itemsOptions:{...c,initialItems:[...B,{categoryId:`points`,amount:`100`}]},note:`退了一部分，剩下的公司报销`})},U={name:`支付行铅笔：账户选择抽屉`,play:({canvasElement:e})=>m(e,`更换支付账户 1`)},W={name:`删除账户后重新选择：没有选中项`,play:async({canvasElement:e})=>{await m(e,`删除支付账户 1`),await m(e,`添加付款账户`)}},G={name:`换成不同币种的账户：确认框在抽屉之上`,play:async({canvasElement:e})=>{await m(e,`更换支付账户 1`),await _.click(await v(e.ownerDocument.body).findByRole(`radio`,{name:`招商银行卡 CNY`}))}},K={name:`明细两排：首排真实金额、次排小数位超出提示`,args:{itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`12.55`},{categoryId:`storage`,amount:`2000`}]}}},q={name:`多账户：点金额打开金额键盘（输入中小票金额不变）`,args:M.args,play:async({canvasElement:e})=>{let t=v(e.ownerDocument.body);await m(e,`修改支付账户 2 金额：¥3,000`);let n=await t.findByLabelText(`金额计算器`);await _.click(v(n).getByRole(`button`,{name:`清空`})),await _.click(v(n).getByRole(`button`,{name:`5`})),await g(t.getByRole(`button`,{name:`修改支付账户 2 金额：¥3,000`,hidden:!0})).toBeInTheDocument()}},J={name:`编辑备注：自动聚焦且只显示抽屉标题`,play:async({canvasElement:e})=>{await m(e,/^修改备注：/),await _.type(v(e.ownerDocument.body).getByRole(`textbox`,{name:`备注`}),`和同事一起吃的午饭`)}},Y={name:`编辑时间（日期展开、时刻保留秒）`,play:({canvasElement:e})=>m(e,/^修改时间：/)},X={name:`保存失败`,args:{action:async()=>({error:`保存失败，请稍后重试。`})},play:({canvasElement:e})=>m(e,`保存记账`)},Z={name:`保存中`,args:{action:async()=>new Promise(()=>{})},play:X.play},Q={name:`小票修改后关闭确认（保存并退出）`,play:async({canvasElement:e})=>{await m(e,/^修改备注：/);let t=v(e.ownerDocument.body);await _.type(t.getByRole(`textbox`,{name:`备注`}),`临时备注`),await _.click(t.getByRole(`button`,{name:`完成`})),await _.click(await t.findByRole(`button`,{name:`关闭记账`}))}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "首次选商家：明细与付款账户读取中",
  args: {
    itemsOptions: {
      ...unselectedAccountItemsOptions,
      initialItems: []
    },
    suggestionsMerchantId: "coffee",
    suggestions: undefined
  },
  play: async ({
    canvasElement
  }) => {
    await enterReceipt(canvasElement);
    await expectSuggestionLoadingRows(canvasElement);
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "自动明细待输入：名称与金额各有铅笔",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: {
      ...receiptSuggestions,
      recommendedAccountIds: ["paypay"]
    },
    itemsOptions: receiptItemsOptions
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  play: ({
    canvasElement
  }) => enterReceipt(canvasElement, "星巴克"),
  name: "第一次去的商家：添加付款账户",
  args: {
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: []
    },
    itemsOptions: unselectedAccountItemsOptions
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "纯收入：多账户收款已对上",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "points",
        amount: "10000"
      }],
      initialPayments: twoPayments
    }
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  ...MultiAccountIncome,
  name: "纯收入多账户：新增明细默认选中收入分类",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, "添加明细");
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole("button", {
      name: /积分返还/,
      pressed: true
    })).toBeInTheDocument();
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  ...MultiAccountBalanced,
  name: "新增明细：切换大分类后选中第一个小分类",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, "添加明细");
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: /日用品/
    }));
    await expect(await body.findByRole("button", {
      name: /收纳/,
      pressed: true
    })).toBeInTheDocument();
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "收支混合：只允许一个账户",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "8000"
      }, {
        categoryId: "points",
        amount: "100"
      }]
    }
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "多账户：添加付款账户抽屉",
  args: {
    ...MultiAccountBalanced.args,
    suggestionsMerchantId: "seven",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: ["paypay", "cash"]
    }
  },
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, "添加付款账户");
    const drawer = within(await within(canvasElement.ownerDocument.body).findByRole("radiogroup", {
      name: "收支账户"
    }));
    await expect(drawer.getByRole("radio", {
      name: "乐天银行 JPY"
    })).toBeInTheDocument();
    await expect(drawer.queryByRole("alert")).not.toBeInTheDocument();
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
  name: "待报销明细与收支混合的单账户说明",
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
    await clickButton(canvasElement, "添加付款账户");
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
}`,...Q.parameters?.docs?.source}}},$=`SuggestionsLoading.QuickEntry.AutomaticAccountOnly.FirstVisit.FirstVisitAfterSave.MultiAccountBalanced.MultiAccountIncome.MultiAccountIncomeAddItem.AddItemGroupSwitch.MixedPaymentHint.MultiAccountAddPayment.MultiAccountUnbalanced.SingleAccount.GroupedCategories.SingleCategory.GroupedWithAutomaticNotice.GroupedWithAutomaticNoticeSakura.ItemTags.GroupedSublines.OffsetNetTotal.ReadOnly.AccountPicker.AccountPickerAfterRemoval.CurrencyConfirm.ExcessDecimals.PaymentAmountKeypad.NoteEditor.TimeEditor.SaveError.Saving.Abandon`.split(`.`)}))();export{Q as Abandon,U as AccountPicker,W as AccountPickerAfterRemoval,k as AddItemGroupSwitch,C as AutomaticAccountOnly,G as CurrencyConfirm,K as ExcessDecimals,w as FirstVisit,T as FirstVisitAfterSave,P as GroupedCategories,z as GroupedSublines,I as GroupedWithAutomaticNotice,L as GroupedWithAutomaticNoticeSakura,R as ItemTags,A as MixedPaymentHint,j as MultiAccountAddPayment,E as MultiAccountBalanced,D as MultiAccountIncome,O as MultiAccountIncomeAddItem,M as MultiAccountUnbalanced,J as NoteEditor,V as OffsetNetTotal,q as PaymentAmountKeypad,S as QuickEntry,H as ReadOnly,X as SaveError,Z as Saving,N as SingleAccount,F as SingleCategory,x as SuggestionsLoading,Y as TimeEditor,$ as __namedExportsOrder,y as default};