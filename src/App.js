/*eslint no-restricted-globals: 0*/

/*
 * App.js: Main app components
 */

/*
 * TODO:
 *  - More accurate points conversion/variable
 *      conversion factors (transfer partners/cash/etc.)
 *  - Minimum spend/welcome bonus tracker
 *  - Store card statement date/compute per-statement info
 *      (this will be very complicated and hard)
 *  - Ability to reorder cards
 *  - Change credit card nicknames
 *
 *  - To-dos area?
 */

import React from 'react';

import Container from '@material-ui/core/Container';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import {DataGrid} from '@material-ui/data-grid';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';

import Autocomplete from '@material-ui/lab/Autocomplete';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import 'date-fns';

import MenuIcon from '@material-ui/icons/Menu';
import ListIcon from '@material-ui/icons/List';
import AccountBalanceIcon from '@material-ui/icons/AccountBalance';
import CreditCardIcon from '@material-ui/icons/CreditCard';
import TrashIcon from '@material-ui/icons/Delete';
import AssessmentIcon from '@material-ui/icons/Assessment';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import EventNoteIcon from '@material-ui/icons/EventNote';
import EventIcon from '@material-ui/icons/Event';

import { PieChart } from 'react-minimal-pie-chart';
import ReactTooltip from 'react-tooltip';

import card_db from './cards.js';

/*
 * GLOBAL UTILS
 */
function format_money(money){
  let out = '',
      str = money.toFixed(2).toString(),
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

function encode_string_as_color(string){
  let out = '',
      color = {r:0,g:0,b:0};

  color.r = string.charCodeAt(0);
  color.g = string.charCodeAt(string.length/2);
  color.b = string.charCodeAt(string.length-1);

  out = `rgb(${color.r}, ${color.g}, ${color.b})`;

  return out;
}

let should_rerender = true;

/*
 * REUSED COMPONENTS
 */
class AddCardDialog extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      card: null,
      nickname: '',

      name_error: false,
      name_error_text: '',

      nickname_error: false,
      nickname_error_text: ''
    };
    this.change_value = this.change_value.bind(this);
    this.change_nickname = this.change_nickname.bind(this);
    this.validate = this.validate.bind(this);
  }
  change_value(e, card){
    if(card === null){
      this.setState({
        card,
        name_error: false,
        name_error_text: ''
      });
    } else {
      this.setState({
        card,
        name_error: false,
        name_error_text: ''
      });
    }
  }
  change_nickname(e){
    this.setState({
      nickname: e.target.value,
      nickname_error: false,
      nickname_error_text: ''
    });
  }
  validate(){
    let out = true;

    if(!this.state.card){
      this.setState({
        name_error: true,
        name_error_text: 'Please select an account. If your account is not listed, select from the generic options at the bottom.'
      });
      return false;
    }

    if(this.props.existing_cards.find(el=>el.nickname===(this.state.nickname===''?this.state.card.name:this.state.nickname)) !== undefined){
      this.setState({
        nickname_error: true,
        nickname_error_text: 'A card with this name or nickname already exists.'
      });
      out = false;
    }
    return out;
  }
  render(){
    return (
      <Dialog open={this.props.open} onClose={()=>{this.change_value(undefined, card_db[card_db.length-1]);this.change_nickname({target:{value:''}});this.props.onClose(undefined)}}>
        <DialogTitle variant="h6" style={{width:"500px"}}>Add an account</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={card_db.sort((a, b)=>{if(a.issuer==='Other') return 1; else if(b.issuer==='Other') return -1; else return -b.issuer.localeCompare(a.issuer)})}
            groupBy={(option) => option.issuer}
            getOptionLabel={(option) => {return ((option.issuer==='Other'?'':option.issuer+' ')+option.name)||''}}
            onChange={this.change_value}
            renderInput={(params) => (
              <TextField {...params} label="Account name" margin="normal" variant="outlined" fullWidth error={this.state.name_error} helperText={this.state.name_error_text} />
            )}
          />
          <TextField label="Nickname (optional)" variant="outlined" fullWidth error={this.state.nickname_error} helperText={this.state.nickname_error_text} value={this.state.nickname} onChange={this.change_nickname} />
          <br />
          <br />
          {
            (this.state.card !== null && this.state.card.type !== 'Debit' ? (
              <DialogContentText>
                Annual fee: ${this.state.card===null?'0':this.state.card.fee}
                <br />
                Recommended credit score: {this.state.card===null?'N/A':this.state.card.credit}
              </DialogContentText>
            ) : (<></>))
          }
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="primary" onClick={()=>{if(this.validate()){this.change_value(undefined, card_db[card_db.length-1]);this.change_nickname({target:{value:''}});this.props.onClose(this.state.card, this.state.nickname)}}}>Add</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

/*
class AddTransDialog extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      trans: {id: Date.now(), date: new Date(Date.now()), name: 'jeff', amount: '$123', card: 'meme', category: 'other'}
    };
    this.handleDateChange = this.handleDateChange.bind(this);
  }
  handleDateChange(date){
    let cpy = JSON.parse(JSON.stringify(this.state.trans));
    cpy.date = date;
    this.setState({
      trans: cpy
    });
  }
  render(){
    return (
      <Dialog open={this.props.open} onClose={()=>{this.props.onClose(undefined)}}>
        <DialogTitle variant="h6" style={{width:"500px"}}>Add a transaction</DialogTitle>
        <DialogContent>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              disableToolbar
              variant="inline"
              format="MM/dd/yyyy"
              margin="normal"
              id="date-picker-inline"
              label="Date"
              value={this.state.trans.date}
              onChange={this.handleDateChange}
            />
            <TextField variant="outlined" label="Name" />
          </MuiPickersUtilsProvider>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="secondary" onClick={()=>{this.props.onClose(this.state.trans);this.state.trans.id=Date.now()}}>Add</Button>
        </DialogActions>
      </Dialog>
    );
  }
}
*/

class ViewController extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      drawer: false,
      drawer_type: (window.innerWidth < 900 ? 'temporary' : 'permanent')
    };
    this.toggle_drawer = this.toggle_drawer.bind(this);
  }
  componentDidMount(){
    window.addEventListener('resize', ()=>{
      let old = this.state.drawer_type;
      this.setState({
        drawer_type: (window.innerWidth < 900 ? 'temporary' : 'permanent')
      });
      if(old !== this.state.drawer_type && this.state.drawer_type === 'temporary') this.setState({drawer:false});
    });
  }
  toggle_drawer(){
    this.setState({
      drawer: !this.state.drawer
    });
  }
  render(){
    return (
      <div>
        <AppBar position="static" style={this.state.drawer_type==='permanent'?{width:'calc(100vw - 200px)', marginLeft:'200px'}:{}}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={this.toggle_drawer} style={this.state.drawer_type==='temporary'?{}:{display:'none',visibility:'hidden',opacity:'0'}}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">
              {this.props.view_name}
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer variant={this.state.drawer_type} open={this.state.drawer} onClose={this.toggle_drawer} style={{width:'200px'}}>
          <List style={{display:'flex',flexDirection:'column',height:'100%'}}>
            {
              Object.keys(this.props.view_names).map((vn, ind)=>{
                if(vn === 'hr') return (<hr key={ind} style={{width:'200px'}}/>);
                return (
                  <ListItem key={ind} button selected={this.props.view_name===vn} onClick={()=>{this.props.changeView(vn);this.setState({drawer:false})}}>
                    <ListItemIcon>{this.props.view_names[vn].icon}</ListItemIcon>
                    <ListItemText>{vn}</ListItemText>
                  </ListItem>
                );
              })
            }
            <div style={{flexGrow:1}}></div>
            <ListItem button selected={this.props.timeframe==='all'} onClick={()=>{this.props.change_timeframe('all')}}>
              <ListItemIcon><EventNoteIcon/></ListItemIcon>
              <ListItemText>View All Time</ListItemText>
            </ListItem>
            <ListItem button selected={this.props.timeframe==='ytd'} onClick={()=>{this.props.change_timeframe('ytd')}}>
              <ListItemIcon><EventIcon/></ListItemIcon>
              <ListItemText>View YTD</ListItemText>
            </ListItem>
            <ListItem button selected={this.props.timeframe==='month'} onClick={()=>{this.props.change_timeframe('month')}}>
              <ListItemIcon><CalendarTodayIcon/></ListItemIcon>
              <ListItemText>View Month</ListItemText>
            </ListItem>
          </List>
        </Drawer>
      </div>
    );
  }
}

class QuickLook extends React.Component {
  render(){
    return (
      <Grid item>
        <Card className="padded-card" style={{textAlign:'center'}}>
          <Typography variant="h4">{this.props.link?(<Link href={this.props.link}>{this.props.value}</Link>):(<>{this.props.value}</>)}</Typography>
          <Typography variant="overline">{this.props.label}</Typography>
        </Card>
      </Grid>
    );
  }
}

class Breakdown extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      tooltip: undefined
    };
    this.set_hover = this.set_hover.bind(this);
    this.generate_tooltip = this.generate_tooltip.bind(this);

    this.chart_id = `chart-${Math.random()*10000}`;
  }
  set_hover(hover, ind){
    if(hover === undefined){
      this.setState({
        tooltip: undefined
      });
    } else {
      this.setState({
        tooltip: ind
      });
    }
  }
  generate_tooltip(){
    if(this.state.tooltip === undefined) return null;

    return `${this.props.data[this.state.tooltip][this.props.x]}: ${format_money(this.props.data[this.state.tooltip][this.props.y])}`;
  }
  conform_data(data){
    let out = [];
    data.forEach((datum)=>{
      out.push({
        title: datum[this.props.x],
        value: datum[this.props.y],
        color: encode_string_as_color(datum[this.props.x])
      });
    });
    return out;
  }
  data_is_empty(data){
    let out = true;
    data.forEach((datum)=>{
      if(datum[this.props.y] > 0) out = false;
    });
    return out;
  }
  render(){
    if(this.data_is_empty(this.props.data)){
      return (
        <Typography variant="subtitle1" style={{textAlign:'center'}}>
          <br />
          No spending yet recorded.
        </Typography>
      );
    }

    return (
      <div data-tip='' data-for={this.chart_id}>
        <PieChart
          data={this.conform_data(this.props.data)}
          radius={30}
          lineWidth={30}
          viewBoxSize={[100, 75]}
          center={[50, 32.5]}
          onMouseOver={this.set_hover}
          onMouseOut={()=>{this.set_hover(undefined)}}
          label={()=>{return this.props.title}}
          labelStyle={{
            fontSize: '0.2125rem',
            fontFamily: 'Roboto, sans-serif',
            fill: '#333',
          }}
          labelPosition={0}
        />
        <ReactTooltip id={this.chart_id} getContent={this.generate_tooltip} />
      </div>
    );
  }
}

class View extends React.Component {
  render(){
    return (
      <div style={this.props.view===this.props.number?{}:{display:'none',visibility:'hidden',opacity:'0'}}>
        {this.props.children}
      </div>
    );
  }
}

/*
 * SETUP VIEW
 */
class Setup extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      active_card: 0,
      card_dialog_open: false,

      name: '',
      cards: [],
      credit_score: ''
    };
    this.type_first_name = this.type_first_name.bind(this);
    this.type_credit_score = this.type_credit_score.bind(this);
    this.add_card = this.add_card.bind(this);
    this.card_dialog_close = this.card_dialog_close.bind(this);
  }
  type_first_name(e){
    this.setState({
      active_card: (e.target.value.trim() === '' ? 0 : (this.state.active_card === 0 ? 1 : this.state.active_card)),
      name: e.target.value.trim()
    });
  }
  type_credit_score(e){
    this.setState({
      credit_score: e.target.value
    });
  }
  add_card(){
    this.setState({
      card_dialog_open: true
    });
  }
  card_dialog_close(new_card, nickname){
    let arr = this.state.cards;
    if(new_card !== undefined){
      arr.push({...new_card,nickname:nickname||new_card.name,outstanding_debt:0,rewards:0,balance:0});
      if(new_card.type !== 'Debit' &&
        (new_card.credit_score > parseInt(this.state.credit_score) ||
        isNaN(parseInt(this.state.credit_score)))){
        this.setState({credit_score:new_card.credit.toString()});
      }
    }
    this.setState({
      cards: arr,
      card_dialog_open: false,
      active_card: (arr.length > 0 ? 2 : 1)
    });
  }
  render(){
    return (
      <div style={this.props.visible ? {} : {display:'none',visibility:'hidden',opacity:'0'}}>
        <div className="hero">
          <div>
            <Card variant="outlined" className="padded-card">
              <CardContent>
                <Typography variant="h2" gutterBottom>
                  Money
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Keep tabs on how your money moves.
                </Typography>
                <br />
                <a href="#setup-start" className="no-underline">
                  <Button variant="outlined" color="primary" className="full-width">Get started</Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
        <br />
        <br />
        <Container maxWidth="sm" id="setup-start">
          <Card className="padded-card">
            <CardContent>
              <Typography variant="h3" gutterBottom>
                First things first:
              </Typography>
              <TextField label="What's your first name?" variant="outlined" fullWidth onChange={this.type_first_name} />
            </CardContent>
          </Card>
          <br />
          <hr />
          <br />
          <Card className="padded-card" style={this.state.active_card >= 1 ? {} : {opacity:'0.5', pointerEvents:'none'}}>
            <CardContent>
              <Typography variant="h3" gutterBottom>
                What accounts do you have?
              </Typography>
              <br />
              {
                this.state.cards.map((item, i)=>{
                  return (
                    <div key={i}>
                      <Card variant="outlined" className="full-width media-card">
                        <CardMedia image={item.image} className="media-card-image" />
                        <CardContent className="media-card-text">
                          <Typography variant="subtitle1">
                            {item.issuer}
                          </Typography>
                          <Typography variant="h5" gutterBottom>
                            {item.nickname}
                          </Typography>
                          <Typography variant="subtitle1">
                            Annual fee:  ${item.fee}
                          </Typography>
                        </CardContent>
                      </Card>
                      <br />
                    </div>
                  );
                })
              }
              <br />
              <Button variant="contained" color="secondary" className="full-width" onClick={this.add_card}>Add card</Button>
              <AddCardDialog open={this.state.card_dialog_open} onClose={this.card_dialog_close} existing_cards={this.state.cards} />
            </CardContent>
          </Card>
          <br />
          <Card className="padded-card" style={this.state.active_card >= 1 ? {} : {opacity:'0.5', pointerEvents:'none'}}>
            <CardContent>
              <Typography variant="h3" gutterBottom>
                What's your credit score?
              </Typography>
              <TextField label="Optional" variant="outlined" fullWidth value={this.state.credit_score} onChange={this.type_credit_score} />
            </CardContent>
          </Card>
          <br />
          <hr />
          <br />
          <Button variant="contained" color="primary" fullWidth className="opacity-transition" style={this.state.active_card >= 2 ? {} : {opacity:'0.5', pointerEvents:'none'}} onClick={()=>{this.props.store_cards(this.state.cards);this.props.next_view({name:this.state.name})}}>Go!</Button>
          <br />
          <br />
        </Container>
      </div>
    );
  }
}

/*
 * CARD SIMULATOR VIEW
 */
class CardSimulator extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      base: 1
    };
    this.change_base = this.change_base.bind(this);
    this.compute_rewards = this.compute_rewards.bind(this);
    this.compute_card = this.compute_card.bind(this);
    this.compute_base = this.compute_base.bind(this);
    this.data_is_empty = this.data_is_empty.bind(this);

    this.categories = [
      "Restaurants",
      "Travel",
      "Groceries",
      "Gas",
      "Entertainment",
      "Online shopping",
      "Other"
    ];
  }
  change_base(e){
    this.setState({base:e.target.value});
  }
  compute_rewards(row){
    return row.amount * row.card[row.category.toLowerCase()] * row.card.conversion;
  }
  compute_card(cat, db){
    let obj = this.props.category_data.find(el=>el.category===cat),
      out = {projected: -Infinity},
      projected = -Infinity;

    (db ?? card_db).forEach((card)=>{
      projected = this.compute_rewards({
        card,
        amount: obj.total_spend,
        category: cat
      });
      if(projected > out.projected){
        out = {
          category: cat,
          card,
          current: obj.rewards,
          projected
        };
      }
    });

    return out;
  }
  compute_base(){
    let projections = this.categories.map(cat=>this.compute_card(cat));
    projections = projections.sort((a,b)=>{return b.projected-a.projected});

    this.props.set_recommended_next_card(projections[0].card);

    let base = projections.slice(0, this.state.base),
        db   = base.map(cat=>cat.card);

    projections.slice(this.state.base).forEach((cat)=>{
      base.push(this.compute_card(cat.category, db));
    });
    return base;
  }
  data_is_empty(data){
    let sum = 0;
    data.forEach((datum)=>{
      sum += datum.total_spend;
    });
    return (sum === 0);
  }
  render(){
    return (
      <div>
        <Typography variant="h4" gutterBottom style={{textAlign:'center'}}>
          I'd like to build a&nbsp;
          <Select value={this.state.base} onChange={this.change_base} style={{fontSize:'2.125rem'}}>
            <MenuItem value={1}>1-card</MenuItem>
            <MenuItem value={2}>2-card</MenuItem>
            <MenuItem value={3}>3-card</MenuItem>
            <MenuItem value={4}>4-card</MenuItem>
            <MenuItem value={5}>5-card</MenuItem>
            <MenuItem value={6}>6-card</MenuItem>
            <MenuItem value={7}>7-card</MenuItem>
          </Select>
          &nbsp;base:
        </Typography>
        <br />
        {
          this.data_is_empty(this.props.category_data) ? (
            <Typography variant="subtitle1" style={{textAlign:'center'}}>
              No spending yet recorded.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Card</TableCell>
                    <TableCell align="right">Current Rewards</TableCell>
                    <TableCell align="right">Projected Rewards</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    this.compute_base().map((cat, ind)=>{
                      return (
                        <TableRow key={ind}>
                          <TableCell>{cat.category}</TableCell>
                          <TableCell>{cat.projected===0?'N/A':cat.card.issuer+' '+cat.card.name}</TableCell>
                          <TableCell align="right">{format_money(cat.current)}</TableCell>
                          <TableCell align="right" style={{fontWeight:'bold'}}>{format_money(cat.projected)}</TableCell>
                        </TableRow>
                      );
                    })
                  }
                </TableBody>
              </Table>
            </TableContainer>
          )
        }
      </div>
    );
  }
}

/*
 * MAIN APPLICATION VIEW
 */
class Main extends React.Component {
  constructor(props){
    super(props);
    let state = localStorage.getItem('Main_state');
    if(state === null){
      this.state = {
        view: 0,
        drawer_is_permanent: (window.innerWidth >= 900),
        trans_dialog_open: false,
        card_tab: 0,
        spend_tab: 1,

        total_assets: 0,
        outstanding_debt: 0,
        gross_inflow: 0,
        gross_outflow: 0,

        total_rewards: 0,
        best_performer: undefined,
        recommended_next_card: undefined,

        card_data: [],
        // card_data: [...this.props.cards_from_setup], // XXX: Debug
        category_data: [
          {category:'Restaurants', total_spend: 0, rewards: 0},
          {category:'Travel', total_spend: 0, rewards: 0},
          {category:'Groceries', total_spend: 0, rewards: 0},
          {category:'Gas', total_spend: 0, rewards: 0},
          {category:'Entertainment', total_spend: 0, rewards: 0},
          {category:'Online shopping', total_spend: 0, rewards: 0},
          {category:'Other', total_spend: 0, rewards: 0},
        ],

        card_dialog_open: false,

        view_name: 'Accounts',

        timeframe: 'all',

        rows: []
      };
    } else {
      this.state = JSON.parse(state);
      this.update_everything();
    }

    this.columns = [
      {
        field: 'date',
        headerName: 'Date',
        type: 'date',
        width: 150,
        editable: true,
        renderCell: (id)=>{
          let date = new Date(id.row.date);
          return (
            <span>{date.getMonth()+1}/{date.getDate()}/{date.getFullYear()}</span>
          );
        }
      },
      {
        field: 'name',
        headerName: 'Name',
        width: 150,
        editable: true
      },
      {
        field: 'amount',
        headerName: 'Amount',
        type: 'number',
        width: 150,
        editable: true,
        renderCell: (id) => (
          <span>{format_money(id.row.amount)}</span>
        )
      },
      {
        field: 'card',
        headerName: 'Account',
        width: 150,
        editable: true,
        renderCell: (id) => (
          <Select value={id.row.card} onChange={(e, val)=>{this.change_row({...id, value:val.props.value}, e)}} fullWidth>
            {
              this.state.card_data.map((card, ind)=>{
                return (
                  <MenuItem key={ind} value={card.nickname}>
                    {card.nickname}
                  </MenuItem>
                )
              })
            }
          </Select>
        )
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 150,
        editable: true,
        renderCell: (id) => (
          <Select value={id.row.category} onChange={(e, val)=>{this.change_row({...id, value:val.props.value}, e)}} fullWidth>
            <MenuItem value="Restaurants">Restaurants</MenuItem>
            <MenuItem value="Travel">Travel</MenuItem>
            <MenuItem value="Groceries">Groceries</MenuItem>
            <MenuItem value="Gas">Gas</MenuItem>
            <MenuItem value="Entertainment">Entertainment</MenuItem>
            <MenuItem value="Online shopping">Online shopping</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        )
      },
      {
        field: "action",
        headerName: "Action",
        width: 120,
        renderCell: (id) => (
          <>
            <IconButton onClick={() => this.remove_transaction(id)}>
              <TrashIcon />
            </IconButton>
          </>
        )
      }
    ];

    this.view_names = {
      'Accounts': {index:0,icon:(<ListIcon/>)},
      'hr': {index:-1,icon:(<></>)},
      'Transactions': {index:1,icon:(<AccountBalanceIcon/>)},
      'Rewards': {index:2,icon:(<CreditCardIcon/>)},
      'CC Simulator': {index:3,icon:(<AssessmentIcon/>)}
    };

    this.change_view = this.change_view.bind(this);
    this.add_new_transaction = this.add_new_transaction.bind(this);
    this.remove_transaction = this.remove_transaction.bind(this);
    this.change_row = this.change_row.bind(this);
    this.change_card_tab = this.change_card_tab.bind(this);
    this.change_spend_tab = this.change_spend_tab.bind(this);
    this.close_card_dialog = this.close_card_dialog.bind(this);
    this.remove_card = this.remove_card.bind(this);
    this.change_timeframe = this.change_timeframe.bind(this);

    this.update_everything = this.update_everything.bind(this);

    this.set_recommended_next_card = this.set_recommended_next_card.bind(this);
  }
  componentDidMount(){
    window.addEventListener('resize', ()=>{
      this.setState({
        drawer_is_permanent: (window.innerWidth >= 900)
      });
    });
    window.addEventListener('hashchange', ()=>{
      if(location.hash.indexOf('setup-start') === -1) this.change_view(decodeURIComponent(location.hash.slice(1)));
    });
    // this.update_everything(); // XXX: Debug
  }
  change_view(name){
    this.setState({
      view: this.view_names[name].index,
      view_name: name
    }, ()=>{
      location.hash = name;
      window.scrollTo(0, 0);
    });
  }
  add_new_transaction(){
    this.setState({
      rows: [
        ...this.state.rows,
        {id: (this.state.rows.length===0?0:this.state.rows[this.state.rows.length-1].id+1), date: new Date(Date.now()), name: 'Double click to edit', amount: 0, card: this.state.card_data[0].nickname, category: 'Other'}
      ]
    });
  }
  remove_transaction(id){
    let rows = this.state.rows.slice();
    rows.forEach((row, ind)=>{
      if(row.id === id.row.id) rows.splice(ind, 1);
    });
    this.setState({rows}, this.update_everything);
  }
  change_row(params, evt){
    if(params.row === undefined) params.row = this.state.rows[params.id];
    let new_row = JSON.parse(JSON.stringify(params.row));
    new_row[params.field] = params.value;
    this.setState({
      rows: [
        ...this.state.rows.slice(0, params.id),
        new_row,
        ...this.state.rows.slice(params.id+1)
      ]
    }, this.update_everything);
  }
  change_card_tab(evt, card_tab){
    this.setState({card_tab});
  }
  change_spend_tab(evt, spend_tab){
    this.setState({spend_tab});
  }
  close_card_dialog(card, nickname){
    if(card !== undefined){
      let cpy = JSON.parse(JSON.stringify(card));
      cpy.nickname = (nickname===''?card.name:nickname);
      cpy.outstanding_debt = 0;
      cpy.rewards = 0;
      cpy.balance = 0;
      this.setState({
        card_data: [
          ...this.state.card_data,
          cpy
        ]
      });
    }
    this.setState({
      card_dialog_open: false
    });
  }
  remove_card(card, ind){
    let card_data = this.state.card_data.filter((itr)=>{
      return card.nickname !== itr.nickname;
    });
    this.setState({card_data}, this.update_everything);
  }
  change_timeframe(timeframe){
    this.setState({timeframe}, this.update_everything);
  }
 
  compute_rewards(row){
    if(row.card.type === 'Debit') return 0;

    let card = this.state.card_data.find(el=>el.nickname===row.card);
    if(card === undefined) return 0;

    return (-row.amount) * card[row.category.toLowerCase()] * card.conversion;
  }
  update_everything(cd){
    let out = {
      total_assets: 0,
      outstanding_debt: 0,
      gross_inflow: 0,
      gross_outflow: 0,

      total_rewards: 0,
      best_performer: undefined,

      card_data: cd ?? this.state.card_data,
      category_data: this.state.category_data
    },
      month = new Date().getMonth(), 
      year = new Date().getFullYear();
    out.card_data.forEach((card)=>{
      card.total_spend = 0;
      card.outstanding_debt = 0;
      card.rewards = 0;
      if(card.type === 'Debit') card.balance = 0;
    });
    out.category_data.forEach((cat)=>{
      cat.total_spend = 0;
      cat.rewards = 0;
    });
    this.state.rows.forEach((row)=>{
      out.total_assets += row.amount;

      let card = out.card_data.find(el=>el.nickname===row.card);
      if(card !== undefined && card.type === 'Debit'){
        card.balance += row.amount;
      }

      if(this.state.timeframe === 'month' &&
         new Date(row.date).getMonth() !== month) return;

      if(this.state.timeframe === 'ytd' &&
         new Date(row.date).getFullYear() !== year) return;

      if(row.amount > 0){
        out.gross_inflow += row.amount;
      } else {
        out.gross_outflow += row.amount;
      }

      if(card !== undefined){
        if(row.amount < 0) card.total_spend += Math.abs(row.amount);
        if(card.type !== 'Debit') card.outstanding_debt += row.amount;
        card.rewards += this.compute_rewards(row);
      }

      let cat = out.category_data.find(el=>el.category===row.category);
      if(row.amount < 0) cat.total_spend += Math.abs(row.amount);
      cat.rewards += this.compute_rewards(row);
    });
    out.card_data.forEach((card)=>{
      if(card.type !== 'Debit'){
        out.outstanding_debt += card.outstanding_debt;

        if(card.rewards > 0 &&
           (out.best_performer === undefined ||
            out.best_performer.rewards < card.rewards)){
          out.best_performer = card;
        }
      }
    });
    out.category_data.forEach((cat)=>{
      out.total_rewards += cat.rewards;
    });
    this.setState({...out});
    // this.forceUpdate();
  }
  set_recommended_next_card(recommended_next_card){
    should_rerender = false;
    this.setState({recommended_next_card});
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    if(this.props.cards_from_setup.length > prevProps.cards_from_setup.length){
      this.setState({
        card_data: this.props.cards_from_setup
      });
    }
    localStorage.setItem('Main_state', JSON.stringify(this.state));
  }
  shouldComponentUpdate(){
    if(should_rerender) return true;
    should_rerender = true;
    return false;
  }
  render(){
    return (
      <div style={this.props.visible?{}:{display:'none',visibility:'hidden',opacity:'0'}}>
        <ViewController view_name={this.state.view_name} view_names={this.view_names} changeView={this.change_view} timeframe={this.state.timeframe} change_timeframe={this.change_timeframe} />
        <br />

        <div style={this.state.drawer_is_permanent?{marginLeft:'169px'}:{}}>
          <Container maxWidth="md">
            <View number={0} view={this.state.view}>
              <Typography variant="h4" gutterBottom style={{textAlign:'center'}}>Welcome back {this.props.name}, here's your money at a glance:</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Grid container justifyContent="center" spacing={2}>
                    <QuickLook label="Total Assets" value={format_money(this.state.total_assets)} />
                    <QuickLook label="Outstanding Debt" value={format_money(this.state.outstanding_debt)} />
                  </Grid>
                  <br />
                  <Grid container justifyContent="center" spacing={2}>
                    <QuickLook label="Gross Inflow" value={format_money(this.state.gross_inflow)} />
                    <QuickLook label="Gross Outflow" value={format_money(this.state.gross_outflow)} />
                  </Grid>
                  <br />
                  <br />
                  <Grid container justifyContent="center" spacing={2}>
                    <Button variant="outlined" color="primary" onClick={()=>{this.change_view('Transactions');this.add_new_transaction()}}>Add a Transaction</Button>
                    <span>&nbsp;&nbsp;</span>
                    <Button variant="outlined" color="secondary" onClick={()=>{this.setState({card_dialog_open:true})}}>Add an Account</Button>
                    <AddCardDialog open={this.state.card_dialog_open} onClose={this.close_card_dialog} existing_cards={this.state.card_data} />
                  </Grid>
                </Grid>
              </Grid>
              <br />
              <hr />
              <br />
              <Typography variant="h4" gutterBottom style={{textAlign:'center'}}>Your accounts:</Typography>
              {
                this.state.card_data.map((card, ind)=>{
                  return (
                    <div key={ind}>
                      <Card className="full-width media-card">
                        <CardMedia image={card.image} className="media-card-image" />
                        <CardContent className="media-card-text">
                          <Typography variant="overline">
                            {card.issuer}
                          </Typography>
                          <Typography variant="h5" gutterBottom>
                            {card.nickname}
                          </Typography>
                          {
                            (card.type === 'Debit' ? (
                              <Typography variant="subtitle1">
                                Current balance: {format_money(card.balance)}
                              </Typography>
                            ) : (
                              <Typography variant="subtitle1">
                                Outstanding debt: {format_money(card.outstanding_debt)}
                                <br />
                                Total rewards: {format_money(card.rewards)}
                              </Typography>
                            ))
                          }
                        </CardContent>
                        <CardActions>
                          <IconButton onClick={()=>{this.remove_card(card, ind)}}>
                            <TrashIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                      <br />
                    </div>
                  );
                })
              }
              <Button variant="contained" color="primary" fullWidth onClick={()=>{this.setState({card_dialog_open:true})}}>Add Account</Button>
              <br />
              <hr />
              <br />
              <Typography variant="h4" gutterBottom style={{textAlign:'center'}}>Spending breakdown:</Typography>
              <Paper square>
                <Tabs value={this.state.spend_tab} onChange={this.change_spend_tab} variant="fullWidth" centered>
                  <Tab label="Spending by Account" />
                  <Tab label="Spending by Category" />
                </Tabs>
              </Paper>
              <Breakdown data={this.state.spend_tab===0?this.state.card_data:this.state.category_data} x={this.state.spend_tab===0?"nickname":"category"} y="total_spend" title={'Total Spending: '+format_money(Math.abs(this.state.gross_outflow))} />
              <br />
            </View>

            <View number={1} view={this.state.view}>
              <Typography variant="h4" gutterBottom style={{textAlign:'center'}}>Your transactions at a glance:</Typography>
              <div style={{height:'500px', width:'100%', background:'white'}}>
                <DataGrid
                  rows={this.state.rows}
                  columns={this.columns}
                  pageSize={9}
                  onCellEditCommit={this.change_row}
                />
                <br />
                <Button variant="contained" color="primary" fullWidth onClick={this.add_new_transaction}>Add New</Button>
              </div>
            </View>

            <View number={2} view={this.state.view}>
              <Typography variant="h4" gutterBottom style={{textAlign:'center'}}>Your rewards at a glance:</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Grid container justifyContent="center" spacing={2}>
                    <QuickLook label="Total Rewards" value={format_money(this.state.total_rewards)} />
                    <QuickLook label="Your Best Performer" value={this.state.best_performer===undefined?'N/A':this.state.best_performer.nickname} />
                  </Grid>
                  <br />
                  <Grid container justifyContent="center" alignItems="center" spacing={2}>
                    <QuickLook label="Outstanding debt" value={format_money(this.state.outstanding_debt)} />
                    <QuickLook label="Recommended next card" value={this.state.recommended_next_card===undefined?'N/A':(<><Typography variant="subtitle1">{this.state.recommended_next_card.issuer}</Typography>{this.state.recommended_next_card.name}</>)} link={this.state.recommended_next_card===undefined?null:this.state.recommended_next_card.link} />
                  </Grid>
                </Grid>
              </Grid>
              <br />
              <hr />
              <br />
              <Typography variant="h4" gutterBottom style={{textAlign:'center'}}>Your credit cards:</Typography>
              {
                this.state.card_data.map((card, ind)=>{
                  if(card.type === 'Debit') return (<div key={ind}></div>);
                  return (
                    <div key={ind}>
                      <Card className="full-width media-card">
                        <CardMedia image={card.image} className="media-card-image" />
                        <CardContent className="media-card-text">
                          <Typography variant="overline">
                            {card.issuer}
                          </Typography>
                          <Typography variant="h5" gutterBottom>
                            {card.nickname}
                          </Typography>
                          <Typography variant="subtitle1">
                            Total rewards: {format_money(card.rewards)}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <IconButton onClick={()=>{this.remove_card(card, ind)}}>
                            <TrashIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                      <br />
                    </div>
                  );
                })
              }
              <Button variant="contained" color="primary" fullWidth onClick={()=>{this.setState({card_dialog_open:true})}}>Add Card</Button>
              <br />
              <hr />
              <br />
              <Typography variant="h4" gutterBottom style={{textAlign:'center'}}>Your rewards:</Typography>
              <Paper square>
                <Tabs value={this.state.card_tab} onChange={this.change_card_tab} variant="fullWidth" centered>
                  <Tab label="Rewards by Card" />
                  <Tab label="Rewards by Category" />
                </Tabs>
              </Paper>
              <br />
              <Breakdown data={this.state.card_tab===0?this.state.card_data:this.state.category_data} x={this.state.card_tab===0?"nickname":"category"} y="rewards" title={'Total Rewards: '+format_money(this.state.total_rewards)} />
              <br />
            </View>

            <View number={3} view={this.state.view}>
              <CardSimulator card_data={this.state.card_data} category_data={this.state.category_data} compute_rewards={this.compute_rewards} set_recommended_next_card={this.set_recommended_next_card} />
            </View>

            <View number={4} view={this.state.view}>
              timecard
            </View>
          </Container>
        </div>
      </div>
    );
  }
}

/*
 * ENTRY POINT
 */
export default class App extends React.Component {
  constructor(props){
    super(props);
    let state = localStorage.getItem('App_state');
    if(state === null){
      this.state = {
        view: 0,
        // view: 1, // XXX: Debug
        name: '',
        cards: []
        // cards: [{...card_db.find(el=>el.name==='Total Checking'),nickname:'Total Checking',outstanding_debt:0,rewards:0,balance:0}] // XXX: Debug
      };
    } else this.state = JSON.parse(state);
    this.next_view = this.next_view.bind(this);
    this.store_cards = this.store_cards.bind(this);
  }
  componentDidUpdate(){
    localStorage.setItem('App_state', JSON.stringify(this.state));
  }
  next_view(data){
    this.setState({
      view: this.state.view+1,
      ...data
    });
    window.scrollTo(0, 0);
  }
  store_cards(cards){
    this.setState({cards});
  }
  render(){
    return (
      <div>
        <Setup visible={this.state.view===0} next_view={this.next_view} store_cards={this.store_cards} />
        <Main visible={this.state.view===1} name={this.state.name} cards_from_setup={this.state.cards} />
      </div>
    );
  }
}
