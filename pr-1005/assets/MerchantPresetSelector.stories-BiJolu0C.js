import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{i,n as a,t as o}from"./ledger-BGt7TM1w.js";import{n as s,t as c}from"./merchantPresets-BMocj7XG.js";import{n as l,t as u}from"./MerchantPresetSelector-C4BZxlLp.js";function d({initialSelectedKeys:e,initialAdditionalRegions:t=[],initialRegion:n=`jp`,onChange:r,onAdditionalRegionsChange:o}){let s=n,[l,d]=(0,p.useState)(t),[m,h]=(0,p.useState)(e??a(n).merchants.selectedKeys);return(0,f.jsx)(u,{...c(i(s)),region:s,additionalRegions:l,onAdditionalRegionsChange:e=>{d(e),o?.(e)},selectedKeys:m,onChange:e=>{h(e),r?.(e)}})}var f,p,m=t((()=>{f=r(),p=e(n()),o(),s(),l(),d.__docgenInfo={description:`Story 与组件测试共用真实服务端模板的展示数据和受控状态。`,methods:[],displayName:`MerchantPresetSelectorExample`,props:{initialSelectedKeys:{required:!1,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``},initialAdditionalRegions:{required:!1,tsType:{name:`Array`,elements:[{name:`LedgerSetupRegion`}],raw:`LedgerSetupRegion[]`},description:``,defaultValue:{value:`[]`,computed:!1}},initialRegion:{required:!1,tsType:{name:`LedgerSetupRegion`},description:``,defaultValue:{value:`"jp"`,computed:!1}},onAdditionalRegionsChange:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(regions: LedgerSetupRegion[]) => void`,signature:{arguments:[{type:{name:`Array`,elements:[{name:`LedgerSetupRegion`}],raw:`LedgerSetupRegion[]`},name:`regions`}],return:{name:`void`}}},description:``},onChange:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(keys: string[]) => void`,signature:{arguments:[{type:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},name:`keys`}],return:{name:`void`}}},description:``}}}})),h,g,_,v,y,b,x,S,C;t((()=>{h=r(),m(),{userEvent:g,within:_}=__STORYBOOK_MODULE_TEST__,v={title:`Organisms/Merchants/MerchantPresetSelector`,component:d,parameters:{viewport:{defaultViewport:`iphone14`}},decorators:[e=>(0,h.jsx)(`div`,{style:{maxWidth:390,padding:16},children:(0,h.jsx)(e,{})})]},y={name:`默认收起`},b={name:`展开购物`,play:async({canvasElement:e})=>{await g.click(_(e).getByRole(`button`,{name:`购物`}))}},x={name:`追加中国`,play:async({canvasElement:e})=>{await g.click(_(e).getByRole(`button`,{name:/中国常用商家/}))}},S={name:`部分选中`,args:{initialSelectedKeys:[`apple`,`starbucks`]}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "默认收起"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "展开购物",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "购物"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "追加中国",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: /中国常用商家/
    }));
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "部分选中",
  args: {
    initialSelectedKeys: ["apple", "starbucks"]
  }
}`,...S.parameters?.docs?.source}}},C=[`Default`,`Expanded`,`AddedChina`,`Partial`]}))();export{x as AddedChina,y as Default,b as Expanded,S as Partial,C as __namedExportsOrder,v as default};