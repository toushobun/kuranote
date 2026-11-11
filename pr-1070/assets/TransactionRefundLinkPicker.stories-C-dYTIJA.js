import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionRefundLinkPicker-C1Bobk55.js";import{n as o,t as s}from"./transactions-Drf7jnZ1.js";function c({children:e}){return(0,u.useEffect)(()=>{let e=document.documentElement.style,t=e.getPropertyValue(`--app-safe-area-inset-top`),n=e.getPropertyValue(`--app-safe-area-inset-bottom`);return e.setProperty(`--app-safe-area-inset-top`,`3rem`),e.setProperty(`--app-safe-area-inset-bottom`,`1.5rem`),()=>{t?e.setProperty(`--app-safe-area-inset-top`,t):e.removeProperty(`--app-safe-area-inset-top`),n?e.setProperty(`--app-safe-area-inset-bottom`,n):e.removeProperty(`--app-safe-area-inset-bottom`)}},[]),e}var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E;t((()=>{l=r(),u=e(n()),o(),i(),{expect:d,screen:f,userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Transactions/TransactionRefundLinkPicker`,component:a,args:{onChange(){},value:null}},g={name:`未关联（同币种账户可退款）`,play:async({canvasElement:e})=>{await d(m(e).getByText(`退款关联不受剩余可核销额度限制；请选择与收款账户币种一致的候选支出。`)).toBeVisible()}},_={name:`首次打开候选读取中`,args:{loadInitialViewAction:()=>new Promise(()=>void 0)},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await p.click(m(e).getByRole(`button`,{name:`选择退款明细`})),await d(await f.findByText(`关联候选读取中…`)).toBeVisible(),await d(f.getByRole(`progressbar`)).toBeVisible()}},v={name:`首次打开候选读取失败与重试`,args:{loadInitialViewAction:async()=>{throw Error(`storybook initial browse failure`)}},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await p.click(m(e).getByRole(`button`,{name:`选择退款明细`})),await d(await f.findByText(`支出明细加载失败，请稍后重试。`)).toBeVisible(),await d(f.getByRole(`button`,{name:`重试`})).toBeVisible()}},y={name:`退款金额包含净收益差额`,args:{refundAmount:`1500`,value:{accountCurrency:`JPY`,amount:`1200`,categoryName:`午餐`,id:`refund-item-1`,parentCategoryName:`饮食`,refundedAmount:`200`,remainingRefundableAmount:`1000`,transactionAt:`2026-08-15T10:00:00.000Z`,transactionRecordId:`transaction-1`}}},b={name:`全屏弹框安全区`,decorators:[e=>(0,l.jsx)(c,{children:(0,l.jsx)(e,{})})],parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await p.click(m(e).getByRole(`button`,{name:`选择退款明细`})),await f.findByRole(`button`,{name:`关闭退款关联选择器`})}},x={items:[s({categoryItems:[{amount:`1200`,categoryName:`午餐`,categoryType:`expense`,id:`refund-item-1`,parentCategoryName:`饮食`,refundedAmount:`200`,remainingRefundableAmount:`1000`}],merchant_name:`咖啡店`})],nextOffset:null,totalCount:1},S={name:`搜索结果`,args:{loadSearchPageAction:async()=>x},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await p.click(m(e).getByRole(`button`,{name:`选择退款明细`})),await p.click(await f.findByRole(`tab`,{name:`搜索`})),await p.type(f.getByLabelText(`搜索关键词`),`咖啡{Enter}`),await f.findByRole(`button`,{name:`选择退款明细 午餐`})}},C={name:`搜索无结果`,args:{loadSearchPageAction:async()=>({items:[],nextOffset:null,totalCount:0})},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await p.click(m(e).getByRole(`button`,{name:`选择退款明细`})),await p.click(await f.findByRole(`tab`,{name:`搜索`})),await p.type(f.getByLabelText(`搜索关键词`),`不存在{Enter}`),await f.findByText(`没有找到相关流水`)}},w={name:`搜索读取失败`,args:{loadSearchPageAction:async()=>{throw Error(`storybook search failure`)}},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await p.click(m(e).getByRole(`button`,{name:`选择退款明细`})),await p.click(await f.findByRole(`tab`,{name:`搜索`})),await p.type(f.getByLabelText(`搜索关键词`),`7930{Enter}`),await f.findByText(`搜索结果读取失败，请稍后重新读取。`)}},T={name:`与收款账户币种不一致的候选置灰`,args:{accountCurrency:`USD`,refundAmount:`1000`,loadSearchPageAction:async()=>x},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await p.click(m(e).getByRole(`button`,{name:`选择退款明细`})),await p.click(await f.findByRole(`tab`,{name:`搜索`})),await p.type(f.getByLabelText(`搜索关键词`),`咖啡{Enter}`),await d(await f.findByRole(`button`,{name:`选择退款明细 午餐`})).toBeDisabled(),await d(f.getByText(`与收款账户币种（USD）不一致，不可选择`)).toBeVisible()}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "未关联（同币种账户可退款）",
  play: async ({
    canvasElement
  }) => {
    await expect(within(canvasElement).getByText("退款关联不受剩余可核销额度限制；请选择与收款账户币种一致的候选支出。")).toBeVisible();
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "首次打开候选读取中",
  args: {
    loadInitialViewAction: () => new Promise<TransactionTimeGroupViewData>(() => undefined)
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择退款明细"
    }));
    await expect(await screen.findByText("关联候选读取中…")).toBeVisible();
    await expect(screen.getByRole("progressbar")).toBeVisible();
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "首次打开候选读取失败与重试",
  args: {
    loadInitialViewAction: async () => {
      throw new Error("storybook initial browse failure");
    }
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择退款明细"
    }));
    await expect(await screen.findByText("支出明细加载失败，请稍后重试。")).toBeVisible();
    await expect(screen.getByRole("button", {
      name: "重试"
    })).toBeVisible();
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "退款金额包含净收益差额",
  args: {
    refundAmount: "1500",
    value: {
      accountCurrency: "JPY",
      amount: "1200",
      categoryName: "午餐",
      id: "refund-item-1",
      parentCategoryName: "饮食",
      refundedAmount: "200",
      remainingRefundableAmount: "1000",
      transactionAt: "2026-08-15T10:00:00.000Z",
      transactionRecordId: "transaction-1"
    }
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "全屏弹框安全区",
  decorators: [Story => <SimulatedSafeArea>
        <Story />
      </SimulatedSafeArea>],
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择退款明细"
    }));
    await screen.findByRole("button", {
      name: "关闭退款关联选择器"
    });
  }
}`,...b.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "搜索结果",
  args: {
    loadSearchPageAction: async () => refundSearchPage
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择退款明细"
    }));
    await userEvent.click(await screen.findByRole("tab", {
      name: "搜索"
    }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "咖啡{Enter}");
    await screen.findByRole("button", {
      name: "选择退款明细 午餐"
    });
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "搜索无结果",
  args: {
    loadSearchPageAction: async () => ({
      items: [],
      nextOffset: null,
      totalCount: 0
    })
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择退款明细"
    }));
    await userEvent.click(await screen.findByRole("tab", {
      name: "搜索"
    }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "不存在{Enter}");
    await screen.findByText("没有找到相关流水");
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "搜索读取失败",
  args: {
    loadSearchPageAction: async () => {
      throw new Error("storybook search failure");
    }
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择退款明细"
    }));
    await userEvent.click(await screen.findByRole("tab", {
      name: "搜索"
    }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "7930{Enter}");
    await screen.findByText("搜索结果读取失败，请稍后重新读取。");
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "与收款账户币种不一致的候选置灰",
  args: {
    accountCurrency: "USD",
    refundAmount: "1000",
    loadSearchPageAction: async () => refundSearchPage
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择退款明细"
    }));
    await userEvent.click(await screen.findByRole("tab", {
      name: "搜索"
    }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "咖啡{Enter}");
    await expect(await screen.findByRole("button", {
      name: "选择退款明细 午餐"
    })).toBeDisabled();
    await expect(screen.getByText("与收款账户币种（USD）不一致，不可选择")).toBeVisible();
  }
}`,...T.parameters?.docs?.source}}},E=[`Default`,`BrowseLoading`,`BrowseLoadError`,`NetIncomeDifference`,`FullScreenSafeArea`,`SearchResults`,`EmptySearchResults`,`SearchError`,`CurrencyMismatchedCandidates`]}))();export{v as BrowseLoadError,_ as BrowseLoading,T as CurrencyMismatchedCandidates,g as Default,C as EmptySearchResults,b as FullScreenSafeArea,y as NetIncomeDifference,w as SearchError,S as SearchResults,E as __namedExportsOrder,h as default};