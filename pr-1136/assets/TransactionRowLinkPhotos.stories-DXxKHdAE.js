import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,i as n}from"./transactionAttachmentClient-CwJkDoah.js";import{n as r,t as i}from"./TransactionRowLink-CjfGz5vH.js";var a,o,s,c,l,u,d,f,p,m;e((()=>{t(),r(),{mocked:a}=__STORYBOOK_MODULE_TEST__,o={id:`00000000-0000-4000-8000-000000009001`,type:`expense`,transaction_at:`2026-11-18T03:10:00.000Z`,amount:`680`,account_name:`乐天信用卡`,account_currency:`JPY`,categoryItems:[{amount:`680`,categoryName:`餐饮 · 午餐`,parentCategoryName:`餐饮`}],merchant_name:`7-Eleven`,merchant_icon_url:null,note:null},s={...o,attachmentCount:2,attachmentLedgerId:`00000000-0000-4000-8000-000000009002`},c=`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22650%22%3E%3Crect%20width%3D%22400%22%20height%3D%22650%22%20fill%3D%22%23f3eee5%22%2F%3E%3Ctext%20x%3D%2280%22%20y%3D%22110%22%20font-size%3D%2228%22%20fill%3D%22%23333%22%3E7-Eleven%3C%2Ftext%3E%3Cpath%20d%3D%22M60%20145h280M60%20185h200M60%20240h250M60%20280h120M60%20340h280%22%20stroke%3D%22%23aca499%22%20stroke-width%3D%226%22%2F%3E%3Ctext%20x%3D%22180%22%20y%3D%22420%22%20font-size%3D%2222%22%3E%C2%A5680%3C%2Ftext%3E%3C%2Fsvg%3E`,l=[{id:`photo-1`,fullUrl:c,thumbnailUrl:c},{id:`photo-2`,fullUrl:c,thumbnailUrl:c}],u={title:`Molecules/Transactions/TransactionRowLinkPhotos`,component:i,beforeEach(){a(n).mockResolvedValue(l)},args:{href:`/transactions/00000000-0000-4000-8000-000000009001`,item:o},parameters:{viewport:{defaultViewport:`mobile2`}}},d={name:`无照片图标`},f={name:`照片图标独立打开预览`,args:{item:s}},p={name:`有照片且有特殊标签`,args:{item:{...s,categoryItems:[{amount:`680`,categoryName:`餐饮 · 午餐`,parentCategoryName:`餐饮`,businessStatus:{incomeLinkRole:null,settlementStatus:`reimbursed`,offsetComposition:{refundAmount:`180`,reimbursementAmount:`0`}}}]}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "无照片图标"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "照片图标独立打开预览",
  args: {
    item: withPhotos
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "有照片且有特殊标签",
  args: {
    item: {
      ...withPhotos,
      categoryItems: [{
        amount: "680",
        categoryName: "餐饮 · 午餐",
        parentCategoryName: "餐饮",
        businessStatus: {
          incomeLinkRole: null,
          settlementStatus: "reimbursed",
          offsetComposition: {
            refundAmount: "180",
            reimbursementAmount: "0"
          }
        }
      }]
    }
  }
}`,...p.parameters?.docs?.source}}},m=[`WithoutPhoto`,`WithPhoto`,`WithPhotoAndSpecialLabel`]}))();export{f as WithPhoto,p as WithPhotoAndSpecialLabel,d as WithoutPhoto,m as __namedExportsOrder,u as default};