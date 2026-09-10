import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./UserThemeProvider-CvJ_H64d.js";import{n as o,t as s}from"./CategoryIconField-DjI-xEzH.js";var c,l,u,d,f,p,m,h;t((()=>{c=r(),l=e(n()),i(),o(),{userEvent:u,within:d}=__STORYBOOK_MODULE_TEST__,f={title:`Organisms/Categories/CategoryIconField`,component:s,decorators:[e=>(0,c.jsx)(a,{storageScope:`storybook-category-icon`,children:(0,c.jsx)(e,{})})],args:{onChange:()=>{},value:`🍜`},render:function(){let[e,t]=(0,l.useState)(`🍜`);return(0,c.jsx)(s,{onChange:t,value:e})}},p={name:`Emoji 图标选择器`},m={name:`分类图标全屏分组浏览`,play:async({canvasElement:e})=>{await u.click(d(e).getByRole(`button`,{name:`选择图标`}))}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "Emoji 图标选择器"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "分类图标全屏分组浏览",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择图标"
    }));
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`Grouped`]}))();export{p as Default,m as Grouped,h as __namedExportsOrder,f as default};