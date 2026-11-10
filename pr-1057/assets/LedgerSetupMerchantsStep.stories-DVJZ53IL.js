import{i as e}from"./preload-helper-D2yxXLVK.js";import{c as t,o as n,t as r}from"./ledger-vCOwyEdk.js";import{a as i,c as a,d as o,i as s,s as c,u as l}from"./LedgerSetupAbandonButton-BVemf1Qw.js";import{n as u,t as d}from"./LedgerSetupWizard-Ders81b8.js";import{n as f,r as p}from"./merchantPresetSelectorTestUtils-DqZZOZ1d.js";function m(e=`jp`,r){let i=t(e),a=n(e,i);return l({livingRegion:e,draft:{...l().setup.draft,merchants:{selectedKeys:r??a.merchants.selectedKeys,skipped:!1}},step:3},i)}var h,g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{u(),i(),o(),f(),r(),{userEvent:h,within:g}=__STORYBOOK_MODULE_TEST__,_=m(),v={title:`Organisms/Ledgers/LedgerSetupMerchantsStep`,component:d,decorators:a,args:{actions:s(_),...c,progress:_},parameters:{viewport:{defaultViewport:`mobile2`}}},y={name:`日本优先（默认展开）`},b={name:`展开购物·订阅`,play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,{name:`购物·订阅`}))}},x={name:`全不选`,args:{progress:m(`jp`,[])}},S={name:`中国优先`,args:{progress:m(`cn`)}},C={name:`日本收起、中国餐饮展开`,play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,p(`jp`))),await h.click(await t.findByRole(`button`,p(`cn`))),await h.click(await t.findByRole(`button`,{name:`餐饮`,expanded:!1})),await h.click(await t.findByRole(`checkbox`,{name:/海底捞/}))}},w={name:`两组都收起`,play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,p(`jp`)))}},T={name:`部分选中`,args:{progress:m(`jp`,_.setup.draft.merchants.selectedKeys.filter(e=>e!==`apple`))}},E={name:`人民币账本使用日本地区`,args:{progress:{..._,setup:{..._.setup,baseCurrency:`CNY`}}}},D={name:`纯本地切换步骤`,args:{actions:{...s(_),persistSetup:async()=>({error:`仅在显式保存或完成时写入`})}},play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,{name:/^下一步/}))}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "日本优先（默认展开）"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "展开购物·订阅",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "购物·订阅"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "全不选",
  args: {
    progress: createMerchantsProgress("jp", [])
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "中国优先",
  args: {
    progress: createMerchantsProgress("cn")
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "日本收起、中国餐饮展开",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", merchantRegionButtonName("jp")));
    await userEvent.click(await body.findByRole("button", merchantRegionButtonName("cn")));
    await userEvent.click(await body.findByRole("button", {
      name: "餐饮",
      expanded: false
    }));
    await userEvent.click(await body.findByRole("checkbox", {
      name: /海底捞/
    }));
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "两组都收起",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", merchantRegionButtonName("jp")));
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "部分选中",
  args: {
    progress: createMerchantsProgress("jp", defaultProgress.setup.draft.merchants.selectedKeys.filter(key => key !== "apple"))
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "人民币账本使用日本地区",
  args: {
    progress: {
      ...defaultProgress,
      setup: {
        ...defaultProgress.setup,
        baseCurrency: "CNY"
      }
    }
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "纯本地切换步骤",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(defaultProgress),
      persistSetup: async () => ({
        error: "仅在显式保存或完成时写入"
      })
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: /^下一步/
    }));
  }
}`,...D.parameters?.docs?.source}}},O=[`Default`,`ExpandShopping`,`SelectNone`,`ChinaFirst`,`AddedChina`,`BothCollapsed`,`Partial`,`DifferentCurrency`,`LocalStepChange`]}))();export{C as AddedChina,w as BothCollapsed,S as ChinaFirst,y as Default,E as DifferentCurrency,b as ExpandShopping,D as LocalStepChange,T as Partial,x as SelectNone,O as __namedExportsOrder,v as default};