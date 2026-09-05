import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./CategoryList-ONG-hxbA.js";var r,i,a,o,s;e((()=>{t(),r={title:`Organisms/Categories/CategoryList`,component:n,args:{archiveCategoryAction:async()=>{},categories:[{children:[{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍞`,id:`00000000-0000-4000-8000-000000000103`,name:`早餐`,parent_id:`00000000-0000-4000-8000-000000000101`,sort_order:10,type:`expense`},{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍜`,id:`00000000-0000-4000-8000-000000000104`,name:`外食`,parent_id:`00000000-0000-4000-8000-000000000101`,sort_order:20,type:`expense`}],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍽️`,id:`00000000-0000-4000-8000-000000000101`,name:`餐饮`,parent_id:null,sort_order:10,type:`expense`},{children:[],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🛒`,id:`00000000-0000-4000-8000-000000000102`,name:`日常购物`,parent_id:null,sort_order:20,type:`expense`},{children:[{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`💴`,id:`00000000-0000-4000-8000-000000000106`,name:`固定工资`,parent_id:`00000000-0000-4000-8000-000000000105`,sort_order:10,type:`income`}],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`💰`,id:`00000000-0000-4000-8000-000000000105`,name:`工资`,parent_id:null,sort_order:10,type:`income`}],onReorderError:()=>{},reorderCategoryAction:async()=>({}),updateCategoryAction:async()=>{}}},i={name:`分类管理列表`},a={name:`只读列表`,args:{canManageCategories:!1}},o={name:`空状态`,args:{categories:[]}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "分类管理列表"
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "只读列表",
  args: {
    canManageCategories: false
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "空状态",
  args: {
    categories: []
  }
}`,...o.parameters?.docs?.source}}},s=[`Default`,`ReadOnly`,`Empty`]}))();export{i as Default,o as Empty,a as ReadOnly,s as __namedExportsOrder,r as default};