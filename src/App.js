import { useState, useEffect } from 'react';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AppBar,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Toolbar,
  Typography
} from '@material-ui/core';

import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';

import {
  Autocomplete
} from '@material-ui/lab';

import {
  AccountBalance,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExpandMore,
  Person
} from '@material-ui/icons';
import ListIcon from '@material-ui/icons/List';

import DateFnsUtils from '@date-io/date-fns';

import { AreaChart } from 'react-easy-chart';
import { PieChart } from 'react-minimal-pie-chart';
import ReactTooltip from 'react-tooltip';

import accounts_db from './accounts.js';

/*
 * GLOBAL UTILS
 */

function format_money(money, no_decimals){
  let out = '',
      str = money.toFixed(no_decimals ? 0 : 2).toString(),
      trail = (str.indexOf('.') > -1 ? str.substring(str.indexOf('.')) : '');

  str.split('').reverse().forEach((char, ind)=>{
    if(char === '-') return;
    if(ind % 3 === 0 && ind > trail.length){
      out += ',';
    }
    out += char;
  });
  out = out.split('').reverse().join('');

  out = `$${out}`;
  if(money < 0) out = `(${out})`;

  return out;
}

function format_date(datestr){
  let date = new Date(datestr);
  return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
}

function collapse_object(obj){
  let out = [];

  for(let key in obj){
    out.push(...obj[key]);
  }

  return out;
}

function sum_all(arr, prop, cmp){
  let initial = {};
  initial[prop] = 0;
  return arr.reduce((prev, next) => {
    let out = {};
    out[prop] = prev[prop];
    if(cmp(next)) out[prop] += next[prop];
    return out;
  }, initial)[prop];
}

function string_to_color(str){
  let hash = 0, i;
  for(i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for(i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

function in_range(val, min, max){
  return (val >= min && val <= max);
}

function local_storage_get(key){
  if(localStorage.getItem(key)) return JSON.parse(localStorage.getItem(key));
}

function is_same_day(a, b){
  let date_a = new Date(a),
    date_b = new Date(b);
  return (date_a.getMonth() === date_b.getMonth() &&
    date_a.getDate() === date_b.getDate() &&
    date_a.getFullYear() === date_b.getFullYear());
}

/*
 * GENERIC CLASSES
 */

class Account {
  constructor(type, obj, date, balance){
    this.id = (Math.random()*10000).toString();

    this.type = type;
    this.issuer = obj.issuer;
    this.name = obj.name;
    this.date = (this.type === 'Credit Card' ? date : undefined);
    this.props = obj;
    this.balance = balance;
  }
}

class Transaction {
  constructor(date, name, category, account, paymentAccount, amount){
    this.date = date;
    this.name = name;
    this.category = category;
    this.account = account;
    this.paymentAccount = (this.category === 'Payment' ? paymentAccount : undefined);
    this.amount = amount;
  }
}

/*
 * COMPONENTS
 */
  /*
function Spacer(){
  return (
    <>
      &nbsp;
    </>
  );
}*/

function View({ number, view, children }){
  return (
    <div style={view===number ? {} : {display:'none',visibility:'hidden'}}>
      {children}
    </div>
  );
}

function NavigationController({ view, setView }){
  const [drawerOpen, setDrawerOpen] = useState(false);

  const viewNames = [
    "Overview",
    "Transactions",
    "Simulator"
  ];
  const viewIcons = [
    (<ListIcon />),
    (<AccountBalance />),
    (<CreditCard />)
  ];

  return (
    <>
      <AppBar position="static" className="appbar">
        <Toolbar>
          <Typography variant="h6" className="appbar-head">
            Money
          </Typography>
          {
            (window.innerWidth > 600 ? (
              <div>
                <Tabs
                  value={view}
                  onChange={(e, n) => setView(n)}
                  centered>
                  {
                    viewNames.map((el, ind) => (
                      <Tab key={ind} label={el} />
                    ))
                  }
                </Tabs>
              </div>
            ) : (
              <div>
                <Button variant="outlined" color="inherit" onClick={() => setDrawerOpen(true) }>{viewNames[view]}</Button>
                <Drawer anchor="top" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                  <List>
                    {
                      viewNames.map((el, ind) => (
                        <ListItem key={ind} button onClick={() => { setView(ind); setDrawerOpen(false); }}>
                          <ListItemIcon>{viewIcons[ind]}</ListItemIcon>
                          <ListItemText>{el}</ListItemText>
                        </ListItem>
                      ))
                    }
                  </List>
                </Drawer>
              </div>
            ))
          }
          <div className="appbar-tail">
            <Person />
          </div>
        </Toolbar>
      </AppBar>
    </>
  );
}

function AccountDialog({ isOpen, addAccount, close }){
  const [accountType, setAccountType] = useState('Checking'),
    [account, setAccount] = useState(),
    [statementDate, setStatementDate] = useState(new Date()),
    [accountError, setAccountError] = useState(false),
    [genericAccountIssuer, setGenericAccountIssuer] = useState(),
    [genericAccountName, setGenericAccountName] = useState(),
    [accountBalance, setAccountBalance] = useState();

  useEffect(() => {
    if(!isOpen){
      setTimeout(() => {
        setAccountType('Checking');
        setAccount();
        setStatementDate(new Date());
        setAccountError(false);
        setGenericAccountIssuer();
        setGenericAccountName();
        setAccountBalance();
      }, 500);
    }
  }, [isOpen]);

  function valid(){
    let out = true;

    if(!account){
      setAccountError(true);
      out = false;
    }

    return out;
  }

  function add_if_valid(callback){
    if(valid()){
      let account_cpy = JSON.parse(JSON.stringify(account));
      if(account.issuer === 'Other' &&
         account.name.indexOf('Generic') > -1){
        account_cpy.issuer = (!genericAccountIssuer || genericAccountIssuer.trim() === '' ? account_cpy.issuer : genericAccountIssuer);
        account_cpy.name = (!genericAccountName || genericAccountName.trim() === '' ? account_cpy.name : genericAccountName);
      }
      addAccount(accountType, account_cpy, statementDate, parseFloat(accountBalance) || 0);
      callback();
    }
  }

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>Add an Account</DialogTitle>
      <DialogContent style={{width: '65vw', maxWidth: '400px'}}>
        <DialogContentText>
          <FormControl variant="outlined" className="fullwidth">
            <InputLabel id="account-type-label">Account type</InputLabel>
            <Select
              variant="outlined"
              label="Account type"
              labelId="account-type-label"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value) }
              fullWidth>
              <MenuItem value="Checking">Checking</MenuItem>
              <MenuItem value="Credit Card">Credit Card</MenuItem>
              <MenuItem value="Savings">Savings</MenuItem>
              <MenuItem value="Investment">Investment</MenuItem>
              <MenuItem value="Loan">Loan</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <br />
          <br />
          <Autocomplete
            options={collapse_object(accounts_db[accountType]).sort((a, b) => {if(a.issuer==='Other') return 1; else if(b.issuer==='Other') return -1; else return -b.issuer.localeCompare(a.issuer)})}
            getOptionLabel={(option) => { return (option.issuer==='Other'?'':option.issuer + ' ') + option.name }}
            groupBy={(option) => option.issuer}
            renderInput={(params) =>
              <TextField
                {...params}
                label="Account name"
                variant="outlined"
                error={accountError}
                helperText={accountError ? 'Please select an option.' : ''}
              />
            }
            onChange={(e, n) => { setAccountError(false); setAccount(n); }}
          />
          <br />
          {
            (accountType === 'Credit Card' ? (
              <>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <KeyboardDatePicker
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    label="Next Statement Date"
                    value={statementDate}
                    onChange={setStatementDate}
                    fullWidth
                  />
                </MuiPickersUtilsProvider>
                <br />
                <br />
              </>
            ) : (<></>))
          }
          {
            (account && account.issuer === 'Other' && account.name.indexOf('Generic') > -1 ? (
              <>
                <TextField
                  variant="outlined"
                  label="Account Issuer (Optional)"
                  fullWidth
                  value={genericAccountIssuer}
                  onChange={(e) => setGenericAccountIssuer(e.target.value)}
                />
                <br />
                <br />
                <TextField
                  variant="outlined"
                  label="Account Name (Optional)"
                  fullWidth
                  value={genericAccountName}
                  onChange={(e) => setGenericAccountName(e.target.value)}
                />
                <br />
                <br />
              </>
            ) : (<></>))
          }
          <TextField
            variant="outlined"
            type="number"
            label="Balance (optional)"
            fullWidth
            value={accountBalance}
            onChange={(e) => setAccountBalance(e.target.value)}
          />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={() => add_if_valid(close) }>Add</Button>
      </DialogActions>
    </Dialog>
  );
}

function TransactionDialog({ isOpen, accounts, addTransaction, close }){
  const [date, setDate] = useState(new Date()),
    [name, setName] = useState(''),
    [category, setCategory] = useState('Restaurants'),
    [account, setAccount] = useState(),
    [paymentAccount, setPaymentAccount] = useState(),
    [amount, setAmount] = useState();

  const [nameError, setNameError] = useState(false),
    [amountError, setAmountError] = useState(false),
    [paymentAccountError, setPaymentAccountError] = useState(false);

  function valid(){
    let out = true;
    if(name.trim() === ''){
      setNameError(true);
      out = false;
    }
    if(!amount){
      setAmountError(true);
      out = false;
    }
    if(category === 'Payment' && paymentAccount === account){
      setPaymentAccountError(true);
      out = false;
    }
    return out;
  }

  useEffect(() => {
    if(isOpen){
      setDate(new Date());
      setName('');
      setCategory('Restaurants');
      setAccount(accounts[0]);
      setPaymentAccount(accounts[0]);
      setAmount();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>Add a Transaction</DialogTitle>
      <DialogContent style={{width: '65vw', maxWidth: '400px'}}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <KeyboardDatePicker
            disableToolbar
            variant="inline"
            format="MM/dd/yyyy"
            label="Date"
            value={date}
            onChange={setDate}
            fullWidth
          />
        </MuiPickersUtilsProvider>
        <br />
        <br />
        <TextField
          variant="outlined"
          label="Name"
          fullWidth
          error={nameError}
          helperText={nameError ? 'Please enter a name.' : ''}
          value={name}
          onChange={(e) => { setNameError(false); setName(e.target.value); }}
        />
        <br />
        <br />
        <FormControl variant="outlined" className="fullwidth">
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            variant="outlined"
            label="Category"
            label-id="category-label"
            value={category}
            onChange={(e) => setCategory(e.target.value) }
            fullWidth
          >
              <MenuItem value="Restaurants">Restaurants</MenuItem>
              <MenuItem value="Travel / Entertainment">Travel / Entertainment</MenuItem>
              <MenuItem value="Groceries">Groceries</MenuItem>
              <MenuItem value="Gas">Gas</MenuItem>
              <MenuItem value="Online shopping">Online shopping</MenuItem>
              <MenuItem value="Payment">Payment</MenuItem>
              <MenuItem value="Deposit / Withdrawal">Deposit / Withdrawal</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        <br />
        <br />
        <FormControl variant="outlined" className="fullwidth">
          <InputLabel id="account-label">Account</InputLabel>
          <Select
            variant="outlined"
            label="Account"
            label-id="account-label"
            value={account}
            onChange={(e) => { setPaymentAccountError(false); setAccount(e.target.value) }}
            fullWidth
          >
            {
              accounts.map((acc, ind) => (
                <MenuItem key={ind} value={acc}>{acc.issuer==='Other'?'':acc.issuer} {acc.name}</MenuItem>
              ))
            }
          </Select>
        </FormControl>
        <br />
        <br />
        {
          (category === 'Payment' ? (
            <>
              <FormControl variant="outlined" className="fullwidth">
                <InputLabel id="payment-account-label">Payment Account</InputLabel>
                <Select
                  variant="outlined"
                  label="Payment Account"
                  label-id="payment-account-label"
                  error={paymentAccountError}
                  helperText={paymentAccountError ? 'Payment account cannot be the same as the account being paid off.' : ''}
                  value={paymentAccount}
                  onChange={(e) => { setPaymentAccountError(false); setPaymentAccount(e.target.value) }}
                  fullWidth
                >
                  {
                    accounts.map((acc, ind) => (
                      <MenuItem key={ind} value={acc}>{acc.issuer==='Other'?'':acc.issuer} {acc.name}</MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
              <br />
              <br />
            </>
          ) : (<></>))
        }
        <TextField
          variant="outlined"
          type="number"
          label="Amount"
          error={amountError}
          helperText={amountError ? 'Please enter an amount.' : ''}
          fullWidth
          value={amount}
          onChange={(e) => { setAmountError(false); setAmount(e.target.value); }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="secondary" onClick={() => { if(valid()) { addTransaction(date, name, category, account, paymentAccount, parseFloat(amount)); close(); }}}>Add</Button>
      </DialogActions>
    </Dialog>
  );
}

function TransactionList({ transactions, max, paginate }){
  const [page, setPage] = useState(0);
  
  return (
    <>
      {
        (transactions.length === 0 ? (
          <Typography variant="subtitle1" style={{textAlign:"center",marginBottom:'10px'}}>
            No transactions yet recorded.
            <br />
            <i>To add an account, click the "+" button on the left panel.</i>
          </Typography>
        ) : (<></>))
      }
      {
        (paginate ? transactions.slice(page*max, (page+1)*max) : transactions).map((trans, ind) => {
          if(ind > max) return (<div key={ind}></div>);
          return (<div key={ind}>
            <Card variant="outlined">
              <CardContent className="flex-space-between">
                <div>
                  <Typography variant="overline">{format_date(trans.date)}</Typography>
                  <Typography variant="h6">{trans.name}</Typography>
                </div>
                <div className="text-align-right">
                  <Typography variant="h6">{format_money(trans.amount)}</Typography>
                  <Typography variant="overline">{trans.account.issuer==='Other'?'':trans.account.issuer} {trans.account.name}</Typography>
                </div>
              </CardContent>
            </Card>
            <br />
          </div>);
        })
      }
      { (paginate ? (
        <div className="flex-center">
          <IconButton onClick={() => setPage(page-1)} disabled={page===0}><ChevronLeft /></IconButton>
          <div>Page {page+1} of {Math.floor(transactions.length/max)+1}</div>
          <IconButton onClick={() => setPage(page+1)} disabled={page===Math.floor(transactions.length/max)}><ChevronRight /></IconButton>
        </div>) : (<></>))
      }
    </>
  );
}

function AccountsAccordion({ name, accounts }){
  if(accounts.length === 0) return (<></>);

  return (
    <Accordion square defaultExpanded className="accordion">
      <AccordionSummary className="accordion-summary" expandIcon={<ExpandMore />}>
        <Typography variant="h6" className="fs-13">{name}</Typography>
        <Typography variant="h6" className="fs-13">{format_money(accounts.reduce((prev, next) => {return {balance: prev.balance+next.balance}}, {balance:0}).balance, true)}</Typography>
      </AccordionSummary>
      <AccordionDetails className="no-margin no-padding">
        <div className="fullwidth">
          {
            accounts.map((account, ind) => {
              return (<div key={ind}>
                <div className="account">
                  <div className="account-left">
                    <Typography variant="h6" className="fs-11">{account.issuer === 'Other' ? account.name : account.issuer}</Typography>
                    <Typography variant="subtitle1" className="fs-9">{account.issuer === 'Other' ? name + ' Account' : account.name}</Typography>
                  </div>
                  <div className="account-right">
                    <Typography variant="h6" className="fs-11">{format_money(account.balance)}</Typography>
                  </div>
                </div>
                <Divider />
              </div>);
            })
          }
        </div>
      </AccordionDetails>
    </Accordion>
  );
}

function CardSimulator({ summary, accounts, transactions }){
  const [baseSize, setBaseSize] = useState(1);

  const categories = [
    "Restaurants",
    "Travel / Entertainment",
    "Groceries",
    "Gas",
    "Online shopping",
    "Other"
  ];
  const db = collapse_object(accounts_db['Credit Card']);

  function rewards(card, trans){
    let cat = trans.category;
    if(categories.indexOf(cat) === -1) return 0;
    if(cat === 'Travel / Entertainment') cat = 'Entertainment';
    return Math.abs(trans.amount * card[cat.toLowerCase()] * card.conversion);
  }

  function sort_cards_by_rewards(){
    let out = db.slice();
    out.forEach(card => {
      let tot = -card.fee;
      transactions.forEach(trans => {
        tot += rewards(card, trans);
      });
      card.total_rewards = tot;
    });
    return out.sort((a, b) => {
      return b.total_rewards-a.total_rewards;
    }).filter(el => el.total_rewards > 0);
  }

  function best_card_for_category(new_db, category){
    let total_spend = transactions.reduce((prev, next) => {
        if(next.category === category){
          return {
            amount: prev.amount + next.amount
          };
        }
        return {amount: prev.amount};
      }, {amount:0}).amount;

    return new_db.reduce((prev, next) => {
      if(rewards(next, {amount: total_spend, category}) >
         rewards(prev, {amount: total_spend, category})){
        return next;
      }
      return prev;
    }, accounts_db['Credit Card']['Other'][0]);
  }

  let new_db = sort_cards_by_rewards(),
    categories_by_spend = [],
    base = [];
  transactions.forEach(trans => {
    if(categories.indexOf(trans.category) > -1){
      let el = categories_by_spend.find(el => el.category === trans.category);
      if(el === undefined) categories_by_spend.push({category: trans.category, spend: trans.amount});
      else el.spend += trans.amount;
    }
  });
  categories_by_spend.sort((a, b) => (a.spend - b.spend));
  categories_by_spend.forEach(el => {
    let out = {...el, card: best_card_for_category(new_db, el.category)};
    out.rewards = rewards(out.card, {category: el.category, amount: el.spend});
    base.push(out);
  });
  base.sort((a, b) => (b.rewards-a.rewards));
  base = base.slice(0, baseSize);

  let total_af = base.reduce((prev, next) => { return {card: {fee: prev.card.fee+next.card.fee}}}, {card:{fee:0}}).card.fee;

  new_db = base.map(el => el.card);
  categories.forEach(cat => {
    if(!base.find(el => el.category === cat)){
      let out = {
        category: cat,
        card: best_card_for_category(new_db, cat)
      },
        spend = categories_by_spend.find(el => el.category === cat);
      if(spend === undefined) spend = 0;
      else spend = spend.spend;
      out.rewards = rewards(out.card, {category: cat, amount: spend});
      base.push(out);
    }
  });
  
  base.sort((a, b) => (b.rewards-a.rewards));

  return (
    <Card>
      <CardContent>
        {
          (transactions.length === 0 ? (
            <Typography variant="subtitle2" className="text-align-center">
              No spending yet recorded.
            </Typography>
            ) : (
            <>
              <Typography variant="h4" className="text-align-center">
                I'd like to build a&nbsp;
                <Select value={baseSize} onChange={(e) => setBaseSize(e.target.value)} style={{fontSize:'2.125rem'}}>
                  {
                    [1,2,3,4,5,6].map(ind => (
                      <MenuItem key={ind} value={ind}>{ind}-card</MenuItem>
                    ))
                  }
                </Select>
                &nbsp;base:
              </Typography>
              <br />
              <TableContainer component={Paper} variant="outlined" style={{maxWidth:Math.min(window.innerWidth - 64, 615)}}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Card</TableCell>
                      <TableCell align="right">Projected Rewards</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {
                      base.map((el, ind) => (
                        <TableRow key={ind}>
                          <TableCell>{el.category}</TableCell>
                          <TableCell>{el.rewards === 0 ? 'N/A' : el.card.issuer + ' ' + el.card.name}</TableCell>
                          <TableCell align="right"><b>{format_money(el.rewards)}</b></TableCell>
                        </TableRow>
                      ))
                    }
                    <TableRow style={{fontStyle:'italic'}}>
                      <TableCell>Total</TableCell>
                      <TableCell>Annual fee{baseSize > 1 ? 's' : ''}: {format_money(total_af, true)}</TableCell>
                      <TableCell align='right'><b>{format_money(base.reduce((prev, next) => { return {rewards: prev.rewards+next.rewards}}).rewards-total_af)}</b></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ))
        }
      </CardContent>
    </Card>
  );
}

function Leftbar({ accounts, summary, openAccountDialog }){
  return (
    <div className="sidebar sidebar-left">
      <div className="sidebar-left-padded">
        <Typography variant="overline" className="flex-space-between">
          Net Worth
          <Button variant="outlined" onClick={openAccountDialog}>+</Button>
        </Typography>
        <Typography variant="h3">{format_money(summary.net_worth, true)}</Typography>
        <Typography variant="subtitle2" color="primary" className="flex-space-between">
          <div>Assets</div>
          <div>{format_money(summary.assets, true)}</div>
        </Typography>
        <LinearProgress variant="determinate" value={100*(summary.assets / ((summary.assets-summary.liabilities)||1))} className="mb-2" />
        <Typography variant="subtitle2" color="secondary" className="flex-space-between">
          <div>Liabilities</div>
          <div>{format_money(summary.liabilities, true)}</div>
        </Typography>
        <LinearProgress variant="determinate" value={Math.abs(100*(summary.liabilities / ((summary.assets-summary.liabilities)||1)))} color="secondary" />
      </div>
      <br />
      <AccountsAccordion name="Cash" accounts={accounts.filter(acc => (acc.type === 'Checking' || acc.type === 'Savings'))} />
      <AccountsAccordion name="Credit" accounts={accounts.filter(acc => (acc.type === 'Credit Card'))} />
      <AccountsAccordion name="Investment" accounts={accounts.filter(acc => (acc.type === 'Investment'))} />
      <AccountsAccordion name="Loan" accounts={accounts.filter(acc => (acc.type === 'Loan'))} />
      <AccountsAccordion name="Other" accounts={accounts.filter(acc => (acc.type === 'Other'))} />
    </div>
  );
}

function MainView({ summary, accounts, transactions, view, setView, openTransactionDialog }){
  const [hover, setHover] = useState(),
    [tooltip, setTooltip] = useState();

  const month = new Date().getMonth(),
    spendingData = [
      {title: 'Restaurants',            value: Math.abs(sum_all(transactions, 'amount', (next) => (new Date(next.date).getMonth()===month && next.category==='Restaurants'))),            color: '#689f38'},
      {title: 'Travel / Entertainment', value: Math.abs(sum_all(transactions, 'amount', (next) => (new Date(next.date).getMonth()===month && next.category==='Travel / Entertainment'))), color: '#ffca28'},
      {title: 'Groceries',              value: Math.abs(sum_all(transactions, 'amount', (next) => (new Date(next.date).getMonth()===month && next.category==='Groceries'))),              color: '#ff9800'},
      {title: 'Gas',                    value: Math.abs(sum_all(transactions, 'amount', (next) => (new Date(next.date).getMonth()===month && next.category==='Gas'))),                    color: '#00838f'},
      {title: 'Online shopping',        value: Math.abs(sum_all(transactions, 'amount', (next) => (new Date(next.date).getMonth()===month && next.category==='Online shopping'))),        color: '#7b1fa2'},
      {title: 'Other',                  value: Math.abs(sum_all(transactions, 'amount', (next) => (new Date(next.date).getMonth()===month && next.category==='Other'))),                  color: '#1a237e'}
    ];

  const shortmonth = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May',
    'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
    'Nov', 'Dec'
  ];

  /* TODO: This adds multiple data points for transactions which occurred on the same day */
  let nw = 0,
    tmp,
    historicalDataRaw = transactions.sort((a, b) => (new Date(a.date) - new Date(b.date))).map((el) => {
      nw += el.amount;
      tmp = new Date(el.date);
      return {
        date: el.date,
        x: `${tmp.getDate()}-${shortmonth[tmp.getMonth()]}-${tmp.getFullYear()-2000}`,
        y: nw
      };
    }),
    historicalData = [];

  historicalDataRaw.forEach(point => {
    let el = historicalData.find(el => is_same_day(el.date, point.date));
    if(el === undefined) historicalData.push(point);
    else if(point.y > el.y){
      historicalData.splice(historicalData.indexOf(el), 1);
      historicalData.push(point);
    }
  });

  function has_spending_data(){
    return (sum_all(spendingData, 'value', () => true) > 0);
  }

  return (
    <div className="mainview">
      <br />
      <View number={0} view={view}>
        <Card className="fullwidth">
          <CardContent>
            <Typography variant="overline">Transactions</Typography>
            <TransactionList transactions={transactions} max={2} paginate={false} />
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => openTransactionDialog() }
              disabled={accounts.length === 0}
            >
              Add New
            </Button>
            <br />
            <br />
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => setView(1) }
            >
              See All
            </Button>
          </CardContent>
        </Card>
        <br />
        <div className="flex-space-between">
          <Card className="flex-grow mr-2">
            <CardContent style={{height:'200px'}}>
              <Typography variant="overline">Cash Flow</Typography>
              <br />
              <br />
              <div>
                <Typography variant="subtitle2" color="primary" className="flex-space-between">
                  <div>Income</div>
                  <div>{format_money(summary.income, true)}</div>
                </Typography>
                <LinearProgress variant="determinate" value={Math.min(100, 100*summary.income/(summary.net_worth||1))} style={{height:'30px'}} />
                <br />
                <Typography variant="subtitle2" color="secondary" className="flex-space-between">
                  <div>Expenses</div>
                  <div>{format_money(summary.expenses, true)}</div>
                </Typography>
                <LinearProgress variant="determinate" value={Math.min(100, Math.abs(100*summary.expenses/(summary.net_worth||1)))} style={{height:'30px'}} color="secondary" />
              </div>
            </CardContent>
          </Card>
          <Card className="flex-grow ml-2" style={{maxWidth:'50%'}}>
            <CardContent style={{height:'200px'}}>
              <Typography variant="overline">Spending</Typography>
              <div data-tip=''>
                <PieChart
                  radius={30}
                  lineWidth={15}
                  viewBoxSize={[120, 65]}
                  center={[60, 65/2]}
                  data={spendingData}
                  label={() => (has_spending_data() ? format_money(Math.abs(summary.expenses)) : 'None yet.')}
                  labelStyle={{
                    fontSize: '0.35rem',
                    fontFamily: 'Roboto, sans-serif',
                    fill: '#333',
                  }}
                  labelPosition={0}
                  onMouseOver={(e, ind) => setHover(`${spendingData[ind].title}: ${format_money(spendingData[ind].value)}`)}
                  onMouseOut={() => setHover(null)}
                />
                <ReactTooltip place="top" type="dark" effect="float" getContent={() => hover} />
              </div>
            </CardContent>
          </Card>
        </div>
        <br />
        <Card>
          <CardContent style={historicalData[0]===undefined||historicalData[0].length===0?{}:{minHeight:'200px'}} data-tip=''>
            <Typography variant="overline">Historical Net Worth</Typography>
            {
              (historicalData[0]===undefined||historicalData[0].length === 0 ? (
                <Typography variant="subtitle2" className="text-align-center">
                  <br />
                  No data yet.
                </Typography>
              ) : (
                <AreaChart
                  width={Math.min(window.innerWidth - 64, 615)}
                  height={200}
                  mouseOverHandler={(d, e) => setTooltip(format_money(d.y, true))}
                  mouseOutHandler={(d, e) => setTooltip()}
                  axes
                  axisLabels={{x: 'Date', y: 'Net Worth'}}
                  xType="time"
                  xTicks={3}
                  dataPoints
                  interpolate="cardinal"
                  data={[historicalData]}
                />
              ))
            }
            <ReactTooltip place="top" type="dark" effect="float" getContent={() => tooltip} />
          </CardContent>
        </Card>
      </View>
      <View number={1} view={view}>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={() => openTransactionDialog() }
          disabled={accounts.length === 0}
        >
          Add New
        </Button>
        <br />
        <br />
        <TransactionList transactions={transactions} max={5} paginate={true} />
      </View>
      <View number={2} view={view}>
        <CardSimulator summary={summary} accounts={accounts} transactions={transactions} />
      </View>
      <br />
    </div>
  );
}

function Rightbar({ summary, accounts, transactions }){
  const REWARDS_TIMESCALE_MONTH = 0,
    REWARDS_TIMESCALE_YTD = 1,
    REWARDS_TIMESCALE_ALL = 2;

  const [hover, setHover] = useState(),
    [rewardsTimescale, setRewardsTimescale] = useState(REWARDS_TIMESCALE_MONTH);

  const db = collapse_object(accounts_db['Credit Card']);

  const categories = [
    "Restaurants",
    "Travel / Entertainment",
    "Groceries",
    "Gas",
    "Online shopping",
    "Other"
  ];

  function rewards(card, trans){
    let cat = trans.category;
    if(categories.indexOf(cat) === -1) return 0;
    if(cat === 'Travel / Entertainment') cat = 'Entertainment';
    return Math.abs(trans.amount * card[cat.toLowerCase()] * card.conversion);
  }

  function sort_cards_by_rewards(){
    let out = db.slice();
    out.forEach(card => {
      let tot = -card.fee;
      transactions.forEach(trans => {
        tot += rewards(card, trans);
      });
      card.total_rewards = tot;
    });
    out.sort((a, b) => {
      return b.total_rewards-a.total_rewards;
    });
    return out;
  }

  let base = sort_cards_by_rewards(),
    rec = base[0],
    i = 0;

  while(accounts.find(el => (el.issuer===rec.issuer&&el.name===rec.name))){
    rec = base[++i];
  }

  /***/

  let chartData = [];
  transactions.forEach(trans => {
    if(trans.account.type !== 'Credit Card') return;
    
    let card = chartData.find(el => el.title === trans.account.name);
    if((rewardsTimescale === REWARDS_TIMESCALE_MONTH &&
        new Date(trans.date).getMonth() === new Date().getMonth()) ||
       (rewardsTimescale === REWARDS_TIMESCALE_YTD &&
        trans.date.getFullYear() === new Date().getFullYear()) ||
       (rewardsTimescale === REWARDS_TIMESCALE_ALL)){
      if(rewards(trans.account.props, trans) > 0){
        if(card === undefined){
          chartData.push({
            title: trans.account.name,
            value: rewards(trans.account.props, trans),
            color: string_to_color(trans.account.name)
          });
        } else {
          card.value += rewards(trans.account.props, trans);
        }
      }
    }
  });
  window.chartData = chartData; /* XXX: This is just terrible */

  /***/

  /* TODO: This breaks if the statement date is on the 29th or later of any month */
  let upcomingStatements = accounts.filter(el => (el.type === 'Credit Card' && in_range(new Date(el.date).getDate()-(new Date()).getDate(), 0, 7)))

  return (
    <div className="sidebar sidebar-right">
      <Card>
        <CardContent>
          <Typography variant="overline">Upcoming Statement Date{upcomingStatements.length === 1 ? '' : 's'}</Typography>
          <br />
          <br />
          <div className="flex-center text-align-center">
            {
              (upcomingStatements.length === 0 ? (
                <Typography variant="subtitle2">
                  No upcoming statement dates.
                </Typography>
              ) : (<></>))
            }
            {
              upcomingStatements.map((card, ind) => (
                <div key={ind}>
                  <img width={300} src={card.props.image} className="card-image" alt="Next card due" />
                  <Typography variant="subtitle1">{card.issuer}</Typography>
                  <Typography variant="h6">{card.name}</Typography>
                  <Typography variant="subtitle2">{new Date().getMonth()+1}/{new Date(card.date).getDate()}/{new Date().getFullYear()}</Typography>
                  <Typography variant="subtitle2">Balance: {format_money(-card.balance)}</Typography>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
      <br />
      <Card>
        <CardContent>
          <Typography variant="overline">Recommended Next Card</Typography>
          <br />
          <br />
          <div className="flex-center text-align-center">
            {
              (summary.expenses === 0 ? (
                  <Typography variant="subtitle2">
                    No recommendation yet.
                  </Typography>
                ) : (
                  <div>
                    <img width={300} src={rec.image} className="card-image" alt="Recommended next card" />
                    <Typography variant="subtitle1">{rec.issuer}</Typography>
                    <Typography variant="h6">{rec.name}</Typography>
                    <Typography variant="subtitle2">Est. Return: {format_money(rec.total_rewards)}</Typography>
                  </div>
                )
              )
            }
          </div>
        </CardContent>
      </Card>
      <br />
      <Card>
        <CardContent>
          <Typography variant="overline">Rewards</Typography>
          <Tabs value={rewardsTimescale} onChange={(e, n) => setRewardsTimescale(n)}>
            <Tab label="Month" className="small-tab" />
            <Tab label="YTD" className="small-tab" />
            <Tab label="All Time" className="small-tab" />
          </Tabs>
          <div data-tip=''>
            {
              (chartData.length === 0 ? (
                <>
                  <br />
                  <Typography variant="subtitle2" className="text-align-center">
                    None yet.
                  </Typography>
                </>
              ) : (
                <>
                    <PieChart
                      radius={30}
                      lineWidth={15}
                      viewBoxSize={[120, 65]}
                      center={[60, 65/2]}
                      data={chartData}
                      label={()=>{return (chartData.length === 0 ? 'None yet.' : format_money(sum_all(chartData, 'value', () => true)))}}
                      labelStyle={{
                        fontSize: '0.35rem',
                        fontFamily: 'Roboto, sans-serif',
                        fill: '#333',
                      }}
                      labelPosition={0}
                      onMouseOver={(e, ind) => setHover(chartData[ind].title + ': ' + format_money(chartData[ind].value))}
                      onMouseOut={() => setHover(null)}
                    />
                    <ReactTooltip place="top" type="dark" effect="float" getContent={() => hover} />
                  </>
                )
              )
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App(){
  const [accounts, setAccounts] = useState(local_storage_get('accounts') || []),
    [transactions, setTransactions] = useState(local_storage_get('transactions') || []),
    [summary, setSummary] = useState({
      net_worth: 0,
      assets: 0,
      liabilities: 0,
      income: 0,
      expenses: 0
    });

  const [view, setView] = useState(0),
        [accountDialog, setAccountDialog] = useState(false),
        [transactionDialog, setTransactionDialog] = useState(false);

  function addAccount(type, account, date, balance){
    let account_class = new Account(type, account, date, balance);

    setAccounts([
      ...accounts,
      account_class
    ]);

    if(balance !== 0){
      setTransactions([
        ...transactions,
        new Transaction(new Date(), 'Starting Balance', 'Starting Balance', account_class, undefined, balance)
      ]);
    }
  }
  function addTransaction(date, name, category, account, paymentAccount, amount){
    setTransactions([
      ...transactions,
      new Transaction(date, name, category, account, paymentAccount, amount)
    ]);
  }

  useEffect(() => {
    setSummary({
      net_worth:   sum_all(accounts, 'balance', (next) => true),
      assets:      sum_all(accounts, 'balance', (next) => next.balance > 0),
      liabilities: sum_all(accounts, 'balance', (next) => next.balance < 0),
      income: summary.income,
      expenses: summary.expenses
    });
  }, [accounts]);

  useEffect(() => {
    const month = new Date().getMonth();

    let new_accounts = accounts.slice(),
      new_trans = transactions.sort((a, b) => b.date - a.date),
      new_summary = {
        net_worth: summary.net_worth,
        assets: summary.assets,
        liabilities: summary.liabilities,
        income: 0,
        expenses: 0
      };
    
    new_accounts.forEach(acc => {
      acc.balance = 0;
    });

    new_trans.forEach(trans => {
      let acc = new_accounts.find((el) => (el.id === trans.account.id));
      if(acc === undefined) return;
      acc.balance += trans.amount;

      if(trans.category === 'Payment'){
        new_accounts.find((el) => (el.id === trans.paymentAccount.id)).balance -= trans.amount;
      }

      if(new Date(trans.date).getMonth() === month){
        if(trans.amount > 0) new_summary.income += trans.amount;
        else new_summary.expenses += trans.amount;
      }
    });

    setAccounts(new_accounts);
    setTransactions(new_trans);
    setSummary(new_summary);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [accounts, transactions]);

  return (
    <>
      <AccountDialog isOpen={accountDialog} addAccount={addAccount} close={() => setAccountDialog(false)} />
      <TransactionDialog accounts={accounts} isOpen={transactionDialog} addTransaction={addTransaction} close={() => setTransactionDialog(false)} />

      <NavigationController view={view} setView={setView} />

      <Grid
        container
        justifyContent="space-between"
      >
        <Leftbar accounts={accounts} summary={summary} openAccountDialog={() => setAccountDialog(true)} />
        <MainView view={view} summary={summary} accounts={accounts} transactions={transactions} setView={setView} openTransactionDialog={() => setTransactionDialog(true)} />
        <Rightbar summary={summary} accounts={accounts} transactions={transactions} />
      </Grid>
    </>
  );
}
