import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{R as n,z as r}from"./iframe-BHWx4XZH.js";import{n as i,t as ee}from"./Stack-CedAN9w3.js";import{n as a,t as te}from"./Divider-DwPLxnrM.js";import{n as ne,t as o}from"./TransactionRow-d0CsCrEe.js";import{a as re,i as ie,n as ae,o as s,r as c,s as l,t as oe}from"./transactionRowSharedPayment.testUtils-Gw23C__W.js";var u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{u=t(),n(),te(),ee(),ne(),oe(),d={id:`00000000-0000-4000-8000-000000009001`,type:`expense`,transaction_at:`2026-06-05T10:30:00.000Z`,amount:`2858`,account_name:`💴 日元现金`,account_currency:`JPY`,categoryItems:[{amount:`1280`,categoryName:`🥬 做饭食材/调料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`498`,categoryName:`🧃 饮料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`324`,categoryName:`🍿 零食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`756`,categoryName:`🧴 日常用品`,parentCategoryName:`🏠 生活用品`,categoryType:`expense`}],merchant_name:`業務スーパー`,merchant_icon_url:null,note:`猪肉・鸡腿・蔬菜`},f={id:`00000000-0000-4000-8000-000000009016`,type:`income`,transaction_at:`2026-06-01T00:00:00.000Z`,amount:`323000`,account_name:`💴 日元现金`,account_currency:`JPY`,categoryItems:[{amount:`280000`,categoryName:`💴 工资`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`15000`,categoryName:`💼 职务手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`20000`,categoryName:`🏠 住房手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`8000`,categoryName:`🚃 通勤手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`}],merchant_name:`株式会社共逹`,merchant_icon_url:null,note:null},p={incomeLinkRole:`refund`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},m={incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},h={...f,amount:`35000`,categoryItems:[{amount:`15000`,businessStatus:p,categoryName:`退款收入`,parentCategoryName:`其他收入`,categoryType:`income`},{amount:`20000`,businessStatus:m,categoryName:`报销收入`,parentCategoryName:`其他收入`,categoryType:`income`}],merchant_name:`关联收入`},g={...f,amount:`1000`,originalAmount:`1980`,categoryItems:[{amount:`1980`,businessNetAmount:`1000`,categoryName:`退款`,categoryType:`income`,parentCategoryName:`特殊收入`,businessStatus:{incomeLinkRole:`refund`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null,surplusAmount:`1000`}}]},_={id:`00000000-0000-4000-8000-000000009003`,type:`transfer`,transaction_at:`2026-06-02T12:54:00.000Z`,amount:`50000`,account_name:`💴 日元现金 → 🏦 储蓄账户`,account_currency:`JPY`,categoryItems:[],merchant_name:null,merchant_icon_url:null,note:null},v={title:`Molecules/Transactions/TransactionRow`,component:o,decorators:[e=>(0,u.jsx)(r,{sx:{bgcolor:`common.white`,minHeight:`100vh`},children:(0,u.jsx)(e,{})})],args:{item:d,receiptCard:!0,showAccount:!0,showTime:!0}},y={name:`普通支出`},b={name:`收入记录`,args:{item:f}},x={name:`退款与报销业务标签`,args:{item:h}},S={name:`记录列表：右下角业务标签与行高对比`,render:()=>{let e={...d,amount:`220`,categoryItems:[{amount:`220`,categoryName:`特产`,parentCategoryName:`购物`,categoryType:`expense`}],merchant_name:`Rakuten`,note:null},t={...e,id:`00000000-0000-4000-8000-000000009002`,categoryItems:[{...e.categoryItems[0],businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:`reimbursed`}}],merchant_name:`日本铁路`},n={...t,id:`00000000-0000-4000-8000-000000009004`,categoryItems:[{...t.categoryItems[0],categoryName:`特别长的生活日用品与家庭采购分类名称需要在标签前省略`}],merchant_name:`便利店`};return(0,u.jsx)(r,{sx:{maxWidth:390},children:(0,u.jsxs)(i,{divider:(0,u.jsx)(a,{}),children:[(0,u.jsx)(o,{item:e,showTime:!0}),(0,u.jsx)(o,{item:t,showTime:!0}),(0,u.jsx)(o,{item:g,showTime:!0}),(0,u.jsx)(o,{item:n,showTime:!0})]})})}},C={name:`结算状态与退款报销核销构成`,args:{item:{...d,amount:`0`,originalAmount:`2858`,categoryItems:[{...d.categoryItems[0],amount:`2858`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`858`,reimbursementAmount:`2000`},settlementStatus:`reimbursed`}}]}}},w={name:`多明细按维度汇总核销构成`,args:{item:{...d,categoryItems:[{...d.categoryItems[0],businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`40`,reimbursementAmount:`0`},settlementStatus:`pendingReimbursement`}},{...d.categoryItems[1],businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`60`,reimbursementAmount:`300`},settlementStatus:`pendingReimbursement`}}]}}},T={name:`单条明细部分已核销`,args:{item:{...d,amount:`1658`,originalAmount:`2858`,categoryItems:[{...d.categoryItems[0],businessNetAmount:`80`},...d.categoryItems.slice(1)]}}},E={name:`部分明细不计入支出`,args:{item:{...d,amount:`1578`,originalAmount:`2858`,categoryItems:[{...d.categoryItems[0],businessNetAmount:`0`},...d.categoryItems.slice(1)]}}},D={name:`完全抵消的退款收入（净额与原金额）`,args:{item:{...h,amount:`0`,originalAmount:`15000`,categoryItems:h.categoryItems.slice(0,1).map(e=>({...e,businessNetAmount:`0`}))}}},O={name:`完全抵消的报销收入（净额与原金额）`,args:{item:{...h,amount:`0`,originalAmount:`20000`,categoryItems:h.categoryItems.slice(1).map(e=>({...e,businessNetAmount:`0`}))}}},k={name:`单账户记录（账户行显示账户名）`,args:{item:{...s,account_name:`我的账户`}}},A={name:`多账户记录（首个账户 等 N 个账户）`,args:{item:s}},j={name:`筛选账户：主金额为本账户份额`,args:{item:c}},M={name:`筛选账户：多账户收入份额`,args:{item:{...c,type:`income`,amount:`7000`,categoryItems:[{amount:`10000`,categoryName:`积分返还`,categoryType:`income`,parentCategoryName:`其他收入`}],merchant_name:`7-Eleven`,record_total_amount:`10000`}}},N={name:`筛选账户 + 分类：主金额为明细全额，只显示整笔`,args:{item:re}},P={name:`筛选账户 + 按分类：组内行为命中该组的明细全额`,args:{item:ie.treatment}},F={name:`按账户分组：组内行为该账户的付款金额`,args:{item:ae.wife}},I={name:`共同支付行与原金额同时出现`,args:{item:l}},L={name:`窄屏下共同支付行换行`,decorators:[e=>(0,u.jsx)(r,{sx:{width:240},children:(0,u.jsx)(e,{})})],args:{item:l}},R={name:`转账记录`,args:{item:_}},z={name:`第二行全部为空`,args:{item:{...d,note:null},showAccount:!1,showTime:!1}},B={name:`无商家`,args:{item:{...d,merchant_name:null,merchant_icon_url:null}}},V={name:`金额为 0`,args:{item:{...d,amount:`0`,categoryItems:[{amount:`0`,categoryName:`💸 金额调整`,parentCategoryName:`📋 其他`,categoryType:`expense`}]}}},H={name:`未来日期`,args:{item:{...d,transaction_at:`2026-12-31T14:30:00.000Z`}}},U={name:`小分类 2 项`,args:{item:{...d,amount:`656`,categoryItems:[{amount:`498`,categoryName:`🍱 便当`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`158`,categoryName:`🧃 饮料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`}]}}},W={name:`小分类 3 项`,args:{item:{...d,amount:`1162`,categoryItems:[{amount:`645`,categoryName:`🥬 做饭食材/调料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`328`,categoryName:`🍎 水果`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`189`,categoryName:`🍿 零食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`}]}}},G={name:`小分类 4 项以上（净支出）`,args:{item:{...d}}},K={name:`混合收支（净收入）`,args:{item:{...f,amount:`278800`,categoryItems:[{amount:`1200`,categoryName:`🍜 外食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`280000`,categoryName:`💴 工资`,parentCategoryName:`💰 工资收入`,categoryType:`income`}]}}},q={name:`小分类 4 项以上（净收入）`,args:{item:{...f}}},J={name:`商家名与金额对齐及元信息行间距对比`,render:()=>(0,u.jsxs)(i,{divider:(0,u.jsx)(a,{}),children:[(0,u.jsx)(o,{item:{...d,originalAmount:`3000`},receiptCard:!1,showAccount:!0,showTime:!0}),(0,u.jsx)(o,{item:{...d,originalAmount:`3000`},receiptCard:!0,showAccount:!0,showTime:!0})]})},Y={name:`商家名到元信息行间距对比`,render:()=>{let e={...d,amount:`1578`,originalAmount:`2858`,categoryItems:[{...d.categoryItems[0],businessNetAmount:`0`},...d.categoryItems.slice(1)]},t={...d,account_name:`💴 很长的家庭共同日元现金账户名称`,note:`这是一条很长的备注内容用于对比换行表现`},n=[d,e,t,{...e,account_name:t.account_name,note:t.note}];return(0,u.jsx)(i,{divider:(0,u.jsx)(a,{}),children:n.map(e=>(0,u.jsx)(o,{item:e,receiptCard:!1,showAccount:!0,showTime:!0},`${e.id}-${e.originalAmount??`ordinary`}-${e.account_name}`))})}},X={name:`长商家名 / 长备注`,args:{item:{...d,merchant_name:`非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的商家名称便利店`,note:`这是一条非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的备注内容`}}},Z={name:`原支出已全额退款（无倒赚标签）`,args:{item:{...d,amount:`0`,originalAmount:`980`,categoryItems:[{amount:`980`,businessNetAmount:`0`,categoryName:`采购`,categoryType:`expense`,parentCategoryName:`日常`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`980`,reimbursementAmount:`0`},settlementStatus:null}}]}}},Q={name:`退款收入净额 +¥1,000 · 倒赚 ¥1,000`,args:{item:g}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "普通支出"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "收入记录",
  args: {
    item: incomeItem
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "退款与报销业务标签",
  args: {
    item: businessStatusItem
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "记录列表：右下角业务标签与行高对比",
  render: () => {
    const categoryOnlyItem: TransactionRowItem = {
      ...expenseItem,
      amount: "220",
      categoryItems: [{
        amount: "220",
        categoryName: "特产",
        parentCategoryName: "购物",
        categoryType: "expense"
      }],
      merchant_name: "Rakuten",
      note: null
    };
    const businessBadgeItem: TransactionRowItem = {
      ...categoryOnlyItem,
      id: "00000000-0000-4000-8000-000000009002",
      categoryItems: [{
        ...categoryOnlyItem.categoryItems[0],
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "0",
            reimbursementAmount: "0"
          },
          settlementStatus: "reimbursed"
        }
      }],
      merchant_name: "日本铁路"
    };
    const longCategoryItem: TransactionRowItem = {
      ...businessBadgeItem,
      id: "00000000-0000-4000-8000-000000009004",
      categoryItems: [{
        ...businessBadgeItem.categoryItems[0],
        categoryName: "特别长的生活日用品与家庭采购分类名称需要在标签前省略"
      }],
      merchant_name: "便利店"
    };
    return <Box sx={{
      maxWidth: 390
    }}>
        <Stack divider={<Divider />}>
          <TransactionRow item={categoryOnlyItem} showTime />
          <TransactionRow item={businessBadgeItem} showTime />
          <TransactionRow item={refundSurplusIncomeItem} showTime />
          <TransactionRow item={longCategoryItem} showTime />
        </Stack>
      </Box>;
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "结算状态与退款报销核销构成",
  args: {
    item: {
      ...expenseItem,
      amount: "0",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        amount: "2858",
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "858",
            reimbursementAmount: "2000"
          },
          settlementStatus: "reimbursed"
        }
      }]
    }
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "多明细按维度汇总核销构成",
  args: {
    item: {
      ...expenseItem,
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "40",
            reimbursementAmount: "0"
          },
          settlementStatus: "pendingReimbursement"
        }
      }, {
        ...expenseItem.categoryItems[1],
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "60",
            reimbursementAmount: "300"
          },
          settlementStatus: "pendingReimbursement"
        }
      }]
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "单条明细部分已核销",
  args: {
    item: {
      ...expenseItem,
      amount: "1658",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "80"
      }, ...expenseItem.categoryItems.slice(1)]
    }
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "部分明细不计入支出",
  args: {
    item: {
      ...expenseItem,
      amount: "1578",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "0"
      }, ...expenseItem.categoryItems.slice(1)]
    }
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "完全抵消的退款收入（净额与原金额）",
  args: {
    item: {
      ...businessStatusItem,
      amount: "0",
      originalAmount: "15000",
      categoryItems: businessStatusItem.categoryItems.slice(0, 1).map(item => ({
        ...item,
        businessNetAmount: "0"
      }))
    }
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "完全抵消的报销收入（净额与原金额）",
  args: {
    item: {
      ...businessStatusItem,
      amount: "0",
      originalAmount: "20000",
      categoryItems: businessStatusItem.categoryItems.slice(1).map(item => ({
        ...item,
        businessNetAmount: "0"
      }))
    }
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "单账户记录（账户行显示账户名）",
  args: {
    item: {
      ...sharedPaymentRowItem,
      account_name: "我的账户"
    }
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "多账户记录（首个账户 等 N 个账户）",
  args: {
    item: sharedPaymentRowItem
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "筛选账户：主金额为本账户份额",
  args: {
    item: sharedPaymentAccountShareRowItem
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "筛选账户：多账户收入份额",
  args: {
    item: {
      ...sharedPaymentAccountShareRowItem,
      type: "income",
      amount: "7000",
      categoryItems: [{
        amount: "10000",
        categoryName: "积分返还",
        categoryType: "income",
        parentCategoryName: "其他收入"
      }],
      merchant_name: "7-Eleven",
      record_total_amount: "10000"
    }
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "筛选账户 + 分类：主金额为明细全额，只显示整笔",
  args: {
    item: sharedPaymentMatchedItemsRowItem
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "筛选账户 + 按分类：组内行为命中该组的明细全额",
  args: {
    item: sharedPaymentCategoryGroupRowItems.treatment
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "按账户分组：组内行为该账户的付款金额",
  args: {
    item: sharedPaymentAccountGroupRowItems.wife
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "共同支付行与原金额同时出现",
  args: {
    item: sharedPaymentWithOriginalAmountRowItem
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "窄屏下共同支付行换行",
  decorators: [Story => <Box sx={{
    width: 240
  }}>
        <Story />
      </Box>],
  args: {
    item: sharedPaymentWithOriginalAmountRowItem
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "转账记录",
  args: {
    item: transferItem
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "第二行全部为空",
  args: {
    item: {
      ...expenseItem,
      note: null
    },
    showAccount: false,
    showTime: false
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "无商家",
  args: {
    item: {
      ...expenseItem,
      merchant_name: null,
      merchant_icon_url: null
    }
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "金额为 0",
  args: {
    item: {
      ...expenseItem,
      amount: "0",
      categoryItems: [{
        amount: "0",
        categoryName: "💸 金额调整",
        parentCategoryName: "📋 其他",
        categoryType: "expense"
      }]
    }
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "未来日期",
  args: {
    item: {
      ...expenseItem,
      transaction_at: "2026-12-31T14:30:00.000Z"
    }
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "小分类 2 项",
  args: {
    item: {
      ...expenseItem,
      amount: "656",
      categoryItems: [{
        amount: "498",
        categoryName: "🍱 便当",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "158",
        categoryName: "🧃 饮料",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }]
    }
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "小分类 3 项",
  args: {
    item: {
      ...expenseItem,
      amount: "1162",
      categoryItems: [{
        amount: "645",
        categoryName: "🥬 做饭食材/调料",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "328",
        categoryName: "🍎 水果",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "189",
        categoryName: "🍿 零食",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }]
    }
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "小分类 4 项以上（净支出）",
  args: {
    item: {
      ...expenseItem
    }
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "混合收支（净收入）",
  args: {
    item: {
      ...incomeItem,
      amount: "278800",
      categoryItems: [{
        amount: "1200",
        categoryName: "🍜 外食",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "280000",
        categoryName: "💴 工资",
        parentCategoryName: "💰 工资收入",
        categoryType: "income"
      }]
    }
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "小分类 4 项以上（净收入）",
  args: {
    item: {
      ...incomeItem
    }
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "商家名与金额对齐及元信息行间距对比",
  render: () => <Stack divider={<Divider />}>
      {/* 同时覆盖真实明细列表的 15px 金额和小票卡片的 18px 金额，
          用于核对第一行文字基线及第一行到 meta 行的垂直间距。 */}
      <TransactionRow item={{
      ...expenseItem,
      originalAmount: "3000"
    }} receiptCard={false} showAccount showTime />
      <TransactionRow item={{
      ...expenseItem,
      originalAmount: "3000"
    }} receiptCard showAccount showTime />
    </Stack>
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "商家名到元信息行间距对比",
  render: () => {
    const adjustedItem: TransactionRowItem = {
      ...expenseItem,
      amount: "1578",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "0"
      }, ...expenseItem.categoryItems.slice(1)]
    };
    const longMetaItem: TransactionRowItem = {
      ...expenseItem,
      account_name: "💴 很长的家庭共同日元现金账户名称",
      note: "这是一条很长的备注内容用于对比换行表现"
    };
    const comparisonItems: TransactionRowItem[] = [expenseItem, adjustedItem, longMetaItem, {
      ...adjustedItem,
      account_name: longMetaItem.account_name,
      note: longMetaItem.note
    }];
    return <Stack divider={<Divider />}>
        {comparisonItems.map(item => <TransactionRow item={item} key={\`\${item.id}-\${item.originalAmount ?? "ordinary"}-\${item.account_name}\`} receiptCard={false} showAccount showTime />)}
      </Stack>;
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "长商家名 / 长备注",
  args: {
    item: {
      ...expenseItem,
      merchant_name: "非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的商家名称便利店",
      note: "这是一条非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的备注内容"
    } as TransactionRowItem
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "原支出已全额退款（无倒赚标签）",
  args: {
    item: {
      ...expenseItem,
      amount: "0",
      originalAmount: "980",
      categoryItems: [{
        amount: "980",
        businessNetAmount: "0",
        categoryName: "采购",
        categoryType: "expense",
        parentCategoryName: "日常",
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "980",
            reimbursementAmount: "0"
          },
          settlementStatus: null
        }
      }]
    }
  }
}`,...Z.parameters?.docs?.source},description:{story:`#1078：原支出抵消到零，倒赚仅属于退款收入记录。`,...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "退款收入净额 +¥1,000 · 倒赚 ¥1,000",
  args: {
    item: refundSurplusIncomeItem
  }
}`,...Q.parameters?.docs?.source}}},$=`ExpenseFull.Income.BusinessStatuses.BusinessBadgeHeightComparison.MixedOffsetSettlement.AggregatedOffsetComposition.PartiallyOffset.PartiallyExcluded.FullyOffsetRefundIncome.FullyOffsetReimbursementIncome.SingleAccount.MultipleAccounts.SharedPaymentAccountShare.MultiAccountIncome.SharedPaymentMatchedItems.SharedPaymentCategoryGroup.SharedPaymentAccountGroup.SharedPaymentWithOriginalAmount.SharedPaymentNarrow.Transfer.NoMetaRow.NoMerchant.ZeroAmount.FutureDate.TwoCategories.ThreeCategories.ManyExpenseCategories.MixedIncomeNet.ManyIncomeCategories.TitleAlignmentAndMetaSpacingComparison.MerchantToMetaGapComparison.LongText.FullyRefundedExpense1078.RefundSurplusIncome1078`.split(`.`)}))();export{w as AggregatedOffsetComposition,S as BusinessBadgeHeightComparison,x as BusinessStatuses,y as ExpenseFull,D as FullyOffsetRefundIncome,O as FullyOffsetReimbursementIncome,Z as FullyRefundedExpense1078,H as FutureDate,b as Income,X as LongText,G as ManyExpenseCategories,q as ManyIncomeCategories,Y as MerchantToMetaGapComparison,K as MixedIncomeNet,C as MixedOffsetSettlement,M as MultiAccountIncome,A as MultipleAccounts,B as NoMerchant,z as NoMetaRow,E as PartiallyExcluded,T as PartiallyOffset,Q as RefundSurplusIncome1078,F as SharedPaymentAccountGroup,j as SharedPaymentAccountShare,P as SharedPaymentCategoryGroup,N as SharedPaymentMatchedItems,L as SharedPaymentNarrow,I as SharedPaymentWithOriginalAmount,k as SingleAccount,W as ThreeCategories,J as TitleAlignmentAndMetaSpacingComparison,R as Transfer,U as TwoCategories,V as ZeroAmount,$ as __namedExportsOrder,v as default};