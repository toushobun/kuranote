import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./CategoryIconField-_-DQUDEo.js";var o,s,c,l,u,d,f,p;t((()=>{o=r(),s=e(n()),i(),{userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u={title:`Organisms/Categories/CategoryIconField`,component:a,args:{onChange:()=>{},value:`🍜`},render:function(){let[e,t]=(0,s.useState)(`🍜`);return(0,o.jsx)(a,{onChange:t,value:e})}},d={name:`Emoji 图标选择器`},f={name:`分类图标小弹窗分组浏览`,play:async({canvasElement:e})=>{await c.click(l(e).getByRole(`button`,{name:`选择图标`}))}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "Emoji 图标选择器"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "分类图标小弹窗分组浏览",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择图标"
    }));
  }
}`,...f.parameters?.docs?.source}}},p=[`Default`,`Grouped`]}))();export{d as Default,f as Grouped,p as __namedExportsOrder,u as default};