import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./MerchantTagManager-Cy8QhR1d.js";var r,i,a,o,s,c,l,u;e((()=>{t(),r=async()=>({}),i=async()=>({}),a={title:`Organisms/Merchants/MerchantTagManager`,component:n,args:{keyword:``,selectedTagId:null,tags:[{icon:`🛒`,id:`tag-1`,merchant_count:6,name:`超市`,sort_order:0},{icon:`🍽️`,id:`tag-2`,merchant_count:4,name:`餐饮`,sort_order:1},{icon:`📦`,id:`tag-3`,merchant_count:2,name:`电商`,sort_order:2}]}},o={args:a.args,name:`内缩横向分类筛选`},s={args:{...a.args,selectedTagId:`tag-1`},name:`选中分类`},c={args:{active:!0,archiveAction:r,createAction:r,mode:`management`,reorderAction:i,tags:a.args.tags,updateAction:r},name:`分类管理行（方形数量与宽松间距）`},l={...c,name:`触屏拖动与实时让位`,parameters:{docs:{description:{story:`按住排序手柄拖动，标签跟手抬起并实时挤开其他行；松手提交。支持鼠标与触屏拖动。`}}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: meta.args,
  name: "内缩横向分类筛选"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    ...meta.args,
    selectedTagId: "tag-1"
  },
  name: "选中分类"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    active: true,
    archiveAction: storyTagAction,
    createAction: storyTagAction,
    mode: "management",
    reorderAction: storyReorderAction,
    tags: meta.args.tags,
    updateAction: storyTagAction
  },
  name: "分类管理行（方形数量与宽松间距）"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  ...Management,
  name: "触屏拖动与实时让位",
  parameters: {
    docs: {
      description: {
        story: "按住排序手柄拖动，标签跟手抬起并实时挤开其他行；松手提交。支持鼠标与触屏拖动。"
      }
    }
  }
}`,...l.parameters?.docs?.source}}},u=[`Default`,`Selected`,`Management`,`DragSorting`]}))();export{o as Default,l as DragSorting,c as Management,s as Selected,u as __namedExportsOrder,a as default};