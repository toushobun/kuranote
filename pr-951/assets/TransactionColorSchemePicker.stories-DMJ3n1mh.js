import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./TransactionColorSchemePicker-JUWpp90_.js";var i,a,o,s,c;e((()=>{i=t(),n(),a={title:`Molecules/Theme/TransactionColorSchemePicker`,component:r,decorators:[e=>(0,i.jsx)(`div`,{style:{maxWidth:360,padding:16},children:(0,i.jsx)(e,{})})],args:{action:async(e,t)=>({success:`收支配色方案已保存。`,transactionColorScheme:t.get(`transactionColorScheme`)})}},o={name:`支出绿 / 收入红（默认）`},s={name:`支出红 / 收入绿`,parameters:{userTheme:{initialTransactionColorScheme:`expense_red_income_green`}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "支出绿 / 收入红（默认）"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "支出红 / 收入绿",
  parameters: {
    userTheme: {
      initialTransactionColorScheme: "expense_red_income_green"
    }
  }
}`,...s.parameters?.docs?.source}}},c=[`Default`,`ExpenseRed`]}))();export{o as Default,s as ExpenseRed,c as __namedExportsOrder,a as default};