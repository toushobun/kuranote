import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionRefundLinkPicker-Dh5LoQOL.js";import{n as o,t as s}from"./transactions-Drf7jnZ1.js";function c({children:e}){return(0,u.useEffect)(()=>{let e=document.documentElement.style,t=e.getPropertyValue(`--app-safe-area-inset-top`),n=e.getPropertyValue(`--app-safe-area-inset-bottom`);return e.setProperty(`--app-safe-area-inset-top`,`3rem`),e.setProperty(`--app-safe-area-inset-bottom`,`1.5rem`),()=>{t?e.setProperty(`--app-safe-area-inset-top`,t):e.removeProperty(`--app-safe-area-inset-top`),n?e.setProperty(`--app-safe-area-inset-bottom`,n):e.removeProperty(`--app-safe-area-inset-bottom`)}},[]),e}var l,u,d,f,p,m,h,g,_,v,y,b,x,S;t((()=>{l=r(),u=e(n()),o(),i(),{screen:d,userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m={title:`Organisms/Transactions/TransactionRefundLinkPicker`,component:a,args:{onChange(){},value:null}},h={},g={name:`退款金额包含净收益差额`,args:{refundAmount:`1500`,value:{accountCurrency:`JPY`,accountId:`account-1`,amount:`1200`,categoryName:`午餐`,id:`refund-item-1`,parentCategoryName:`饮食`,refundedAmount:`200`,remainingRefundableAmount:`1000`,transactionAt:`2026-08-15T10:00:00.000Z`,transactionRecordId:`transaction-1`}}},_={name:`全屏弹框安全区`,decorators:[e=>(0,l.jsx)(c,{children:(0,l.jsx)(e,{})})],parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`选择退款明细`})),await d.findByRole(`button`,{name:`关闭退款关联选择器`})}},v={items:[s({categoryItems:[{accountId:`account-1`,amount:`1200`,categoryName:`午餐`,categoryType:`expense`,id:`refund-item-1`,parentCategoryName:`饮食`,refundedAmount:`200`,remainingRefundableAmount:`1000`}],merchant_name:`咖啡店`})],nextOffset:null,totalCount:1},y={name:`搜索结果`,args:{loadSearchPageAction:async()=>v},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`选择退款明细`})),await f.click(await d.findByRole(`tab`,{name:`搜索`})),await f.type(d.getByLabelText(`搜索关键词`),`咖啡{Enter}`),await d.findByRole(`button`,{name:`选择退款明细 午餐`})}},b={name:`搜索无结果`,args:{loadSearchPageAction:async()=>({items:[],nextOffset:null,totalCount:0})},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`选择退款明细`})),await f.click(await d.findByRole(`tab`,{name:`搜索`})),await f.type(d.getByLabelText(`搜索关键词`),`不存在{Enter}`),await d.findByText(`没有找到相关流水`)}},x={name:`搜索读取失败`,args:{loadSearchPageAction:async()=>{throw Error(`storybook search failure`)}},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`选择退款明细`})),await f.click(await d.findByRole(`tab`,{name:`搜索`})),await f.type(d.getByLabelText(`搜索关键词`),`7930{Enter}`),await d.findByText(`搜索结果读取失败，请稍后重新读取。`)}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "退款金额包含净收益差额",
  args: {
    refundAmount: "1500",
    value: {
      accountCurrency: "JPY",
      accountId: "account-1",
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S=[`Default`,`NetIncomeDifference`,`FullScreenSafeArea`,`SearchResults`,`EmptySearchResults`,`SearchError`]}))();export{h as Default,b as EmptySearchResults,_ as FullScreenSafeArea,g as NetIncomeDifference,x as SearchError,y as SearchResults,S as __namedExportsOrder,m as default};