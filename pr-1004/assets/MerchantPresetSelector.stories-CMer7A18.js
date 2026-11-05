import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{i,n as a,t as o}from"./ledger-BGt7TM1w.js";import{n as s,t as c}from"./merchantPresets-BMocj7XG.js";import{n as l,t as u}from"./MerchantPresetSelector-C5JyJgxa.js";function d({initialSelectedKeys:e,initialAdditionalRegions:t=[],initialRegion:n=`jp`,onChange:r}){let[o,s]=(0,p.useState)(n),[l,d]=(0,p.useState)(t),[m,h]=(0,p.useState)(e??a(n).merchants.selectedKeys);return(0,f.jsx)(u,{...c(i(o)),region:o,additionalRegions:l,onAdditionalRegionsChange:d,onRegionChange:e=>{d([o]),s(e)},selectedKeys:m,onChange:e=>{h(e),r?.(e)}})}var f,p,m=t((()=>{f=r(),p=e(n()),o(),s(),l(),d.__docgenInfo={description:`Story 与组件测试共用真实服务端模板的展示数据和受控状态。`,methods:[],displayName:`MerchantPresetSelectorExample`,props:{initialSelectedKeys:{required:!1,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``},initialAdditionalRegions:{required:!1,tsType:{name:`Array`,elements:[{name:`LedgerSetupRegion`}],raw:`LedgerSetupRegion[]`},description:``,defaultValue:{value:`[]`,computed:!1}},initialRegion:{required:!1,tsType:{name:`LedgerSetupRegion`},description:``,defaultValue:{value:`"jp"`,computed:!1}},onChange:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(keys: string[]) => void`,signature:{arguments:[{type:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},name:`keys`}],return:{name:`void`}}},description:``}}}})),h,g,_,v,y,b,x,S,C,w,T;t((()=>{h=r(),m(),{expect:g,userEvent:_,within:v}=__STORYBOOK_MODULE_TEST__,y={title:`Organisms/Merchants/MerchantPresetSelector`,component:d,parameters:{viewport:{defaultViewport:`iphone14`}},decorators:[e=>(0,h.jsx)(`div`,{style:{maxWidth:390,padding:16},children:(0,h.jsx)(e,{})})]},b={name:`默认收起`},x={name:`展开购物`,play:async({canvasElement:e})=>{await _.click(v(e).getByRole(`button`,{name:`购物`}))}},S={name:`追加中国`,args:{initialAdditionalRegions:[`cn`]}},C={name:`部分选中`,args:{initialSelectedKeys:[`apple`,`starbucks`]}},w={name:`收起追加地区并保留选择`,args:{initialAdditionalRegions:[`cn`],initialSelectedKeys:[`apple`,`haidilao`]},play:async({canvasElement:e})=>{await _.click(v(e).getByRole(`button`,{name:`收起`})),await g(v(e).getByRole(`button`,{name:`展开中国常用商家（已选 1 家）`})).toBeInTheDocument()}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "默认收起"
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "展开购物",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "购物"
    }));
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "追加中国",
  args: {
    initialAdditionalRegions: ["cn"]
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "部分选中",
  args: {
    initialSelectedKeys: ["apple", "starbucks"]
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "收起追加地区并保留选择",
  args: {
    initialAdditionalRegions: ["cn"],
    initialSelectedKeys: ["apple", "haidilao"]
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "收起"
    }));
    await expect(within(canvasElement).getByRole("button", {
      name: "展开中国常用商家（已选 1 家）"
    })).toBeInTheDocument();
  }
}`,...w.parameters?.docs?.source}}},T=[`Default`,`Expanded`,`AddedChina`,`Partial`,`CollapsedChina`]}))();export{S as AddedChina,w as CollapsedChina,b as Default,x as Expanded,C as Partial,T as __namedExportsOrder,y as default};