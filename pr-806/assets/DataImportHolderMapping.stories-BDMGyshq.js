import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./DataImportHolderMapping-B2Xt_WOS.js";var r,i,a,o,s,c;e((()=>{t(),{fn:r}=__STORYBOOK_MODULE_TEST__,i={title:`Organisms/Settings/DataImportHolderMapping`,component:n,args:{candidates:[{name:`小明`,recordCount:12,reason:`unmatched`},{name:`小红`,recordCount:3,reason:`unmatched`},{name:`重名`,recordCount:1,reason:`ambiguous`}],members:[{displayName:`张三`,email:`zhang@example.com`,userId:`user-1`},{displayName:`重名`,email:`a@example.com`,userId:`user-2`},{displayName:`重名`,email:`b@example.com`,userId:`user-3`}],onCancel:r(),onConfirm:r()}},a={name:`默认（含歧义姓名）`},o={name:`仅一个未匹配姓名`,args:{candidates:[{name:`小明`,recordCount:1,reason:`unmatched`}]}},s={name:`禁用`,args:{disabled:!0}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "默认（含歧义姓名）"
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "仅一个未匹配姓名",
  args: {
    candidates: [{
      name: "小明",
      recordCount: 1,
      reason: "unmatched"
    }]
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "禁用",
  args: {
    disabled: true
  }
}`,...s.parameters?.docs?.source}}},c=[`Default`,`SingleName`,`Disabled`]}))();export{a as Default,s as Disabled,o as SingleName,c as __namedExportsOrder,i as default};