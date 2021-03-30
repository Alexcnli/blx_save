import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Platform,
  Alert,
  Button
} from 'react-native';
import BleModule from './src/BleModule';
global.BluetoothManager = new BleModule();  

export default class App extends Component {
    constructor(props) {
        super(props);   
        this.state={
            scaning:false,
            isConnected:false,
            text:'',
            writeData:'',
            receiveData:'',
            readData:'',
            data:[],
            isMonitoring:false,
            left : false,
            up : false,
            right : false,
            down : false,
        }
        this.show = false;
        this.bluetoothReceiveData = [];  
        this.deviceMap = new Map();
        this.getDrivingButtons = this.getDrivingButtons.bind(this);
        this.getPressDown = this.getPressDown.bind(this);
        this.getPressUp = this.getPressUp.bind(this);
    }

    componentDidMount(){
        //檢查藍牙開關
        this.onStateChangeListener = BluetoothManager.manager.onStateChange((state) => {
            console.log("onStateChange: ", state);
            if(state == 'PoweredOn'){
                this.scan();
            }               
        })
    }     

    UNSAFE_componentWillUnmount() {
       BluetoothManager.destroy();
       this.onStateChangeListener && this.onStateChangeListener.remove();
       this.disconnectListener && this.disconnectListener.remove();
       this.monitorListener && this.monitorListener.remove();
    }

    getDrivingButtons() {
        return (
          <View style={styles.drivingButtonsContainer} >
    
            <View style={styles.drivingButton}
              onTouchStart={this.getPressDown('left')} onTouchEnd={this.getPressUp('left')}
              opacity={this.state.left ? .6 : 1} >
              <Text style={styles.buttonText}>◀</Text>
            </View>
    
            <View style={styles.drivingButton}
              onTouchStart={this.getPressDown('up')} onTouchEnd={this.getPressUp('up')}
              opacity={this.state.up ? .6 : 1} >
              <Text style={styles.buttonText}>▲</Text>
            </View>
    
            <View style={styles.drivingButton}
              onTouchStart={this.getPressDown('right')} onTouchEnd={this.getPressUp('right')}
              opacity={this.state.right ? .6 : 1} >
              <Text style={styles.buttonText}>▶</Text>
            </View>
    
            <View style={styles.drivingButton}
              onTouchStart={this.getPressDown('down')} onTouchEnd={this.getPressUp('down')}
              opacity={this.state.down ? .6 : 1} >
              <Text style={styles.buttonText}>▼</Text>
            </View>
          </View>
        )
      }
    
      getPressDown(key) {
        return ()=>{
          let dict = {}
          dict[key] = true
          this.setState(dict)
        }
      }
    
      getPressUp(key) {
        return ()=>{
          let dict = {}
          dict[key] = false
          this.setState(dict)
        }
      }

    alert(text){
        Alert.alert('提示',text,[{ text:'確定',onPress:()=>{ } }]);
    }

    scan(){
        if(!this.state.scaning) {
            this.setState({scaning:true});
            this.deviceMap.clear();
            BluetoothManager.manager.startDeviceScan(null, null, (error, device) => {                
                if (error) {
                    console.log('startDeviceScan error:',error)
                    if(error.errorCode == 102){
                        this.alert('請先打開手機藍牙');
                    }
                    this.setState({scaning:false});   
                }else{
                    console.log(device.id,device.name);
                   if(device.name !== null){
                        this.deviceMap.set(device.id,device);
                   } 
                    this.setState({data:[...this.deviceMap.values()]});      
                }              
            })
            this.scanTimer && clearTimeout(this.scanTimer);
            this.scanTimer = setTimeout(()=>{
                if(this.state.scaning){
                    this.alert('搜索完成');
                    BluetoothManager.stopScan();
                    this.setState({scaning:false});                   
                }                
            },5000)
        }else {
            this.alert('搜索完成');
            BluetoothManager.stopScan();
            this.setState({scaning:false});
        }
    }
   
    connect(item){        
        if(this.state.scaning){  //连接的时候正在扫描，先停止扫描
            BluetoothManager.stopScan();
            this.setState({scaning:false});
        }
        if(BluetoothManager.isConnecting){
            console.log('藍牙已連接，不能再建立新連接');
            return;
        }
        let newData = [...this.deviceMap.values()];
        newData[item.index].isConnecting = true;  //正在连接中
        this.setState({data:newData});
        BluetoothManager.connect(item.item.id)
            .then(device=>{
                newData[item.index].isConnecting = false;
                this.setState({data:[newData[item.index]], isConnected:true});
                this.onDisconnect();
            })
            .catch(err=>{
                newData[item.index].isConnecting = false;
                this.setState({data:[...newData]});
            })
            this.scanTimer && clearTimeout(this.scanTimer);
            this.scanTimer = setTimeout(()=>{
                if(newData[item.index].isConnecting){
                    this.alert('已連接');
                }                
            },10000)
    }

    // read=(index)=>{
    //     BluetoothManager.read(index)
    //         .then(value=>{
    //             this.setState({readData:value});
    //         })
    //         .catch(err=>{

    //         })       
    // }

    // write=(index,type)=>{
    //     if(this.state.text.length == 0){
    //         this.alert('請輸入信息');
    //         return;
    //     }
    //     BluetoothManager.write(this.state.text,index,type)
    //         .then(characteristic=>{
    //             this.bluetoothReceiveData = [];
    //             this.setState({
    //                 writeData:this.state.text,
    //                 text:'',
    //             })
    //         })
    //         .catch(err=>{

    //         })       
    // }

    // writeWithoutResponse=(index,type)=>{
    //     if(this.state.text.length == 0){
    //         this.alert('請輸入信息');
    //         return;
    //     }
    //     BluetoothManager.writeWithoutResponse(this.state.text,index,type)
    //         .then(characteristic=>{
    //             this.bluetoothReceiveData = [];
    //             this.setState({
    //                 writeData:this.state.text,
    //                 text:'',
    //             })
    //         })
    //         .catch(err=>{

    //         })              
    // }

    //監聽藍牙數據 
    monitor=(index)=>{
        let transactionId = 'monitor';
        this.monitorListener = BluetoothManager.manager.monitorCharacteristicForDevice(BluetoothManager.peripheralId,
            BluetoothManager.nofityServiceUUID[index],BluetoothManager.nofityCharacteristicUUID[index],
            (error, characteristic) => {
                if (error) {
                    this.setState({isMonitoring:false});
                    console.log('monitor fail:',error);    
                    this.alert('monitor fail: ' + error.reason);      
                }else{
                    this.setState({isMonitoring:true});
                    this.bluetoothReceiveData.push(characteristic.value); //數據量多的話會分批接收
                    this.setState({receiveData:this.bluetoothReceiveData.join('')})
                    console.log('monitor success',characteristic.value);
                    // this.alert('開啟成功'); 
                }

            }, transactionId)
    }  

    //監聽斷開
    onDisconnect(){        
        this.disconnectListener = BluetoothManager.manager.onDeviceDisconnected(BluetoothManager.peripheralId,(error,device)=>{
            if(error){  //遇到錯誤自動斷開
                console.log('onDeviceDisconnected','device disconnect',error);
                this.setState({data:[...this.deviceMap.values()],isConnected:false});
            }else{
                this.disconnectListener && this.disconnectListener.remove();
                console.log('onDeviceDisconnected','device disconnect',device.id,device.name);
            }
        })
    }

    //斷開藍牙
    disconnect(){
        BluetoothManager.disconnect()
            .then(res=>{
                this.setState({data:[...this.deviceMap.values()],isConnected:false});
            })
            .catch(err=>{
                this.setState({data:[...this.deviceMap.values()],isConnected:false});
            })     
    }   

    renderItem=(item)=>{
        let data = item.item;
        return(
            <TouchableOpacity
                activeOpacity={0.7}
                disabled={this.state.isConnected?true:false}
                onPress={()=>{this.connect(item)}}
                style={styles.item}>                         
                <View style={{flexDirection:'row'}}>
                    <Text style={{color:'black'}}>{data.name?data.name:''}</Text>
                    <Text style={{color:"red",marginLeft:50}}>{data.isConnecting?'連接中...':''}</Text>
                </View>
                <Text>{data.id}</Text>
               
            </TouchableOpacity>
        );
    }

    renderHeader=()=>{
        return(
            <View style={{marginTop:20}}>
                <TouchableOpacity 
                    activeOpacity={0.7}
                    style={[styles.buttonView,{marginHorizontal:10,height:40,alignItems:'center'}]}
                    onPress={this.state.isConnected?this.disconnect.bind(this):this.scan.bind(this)}>
                    <Text style={styles.buttonText}>{this.state.scaning?'正在搜索中':this.state.isConnected?'斷開藍牙':'搜索藍牙'}</Text>
                </TouchableOpacity>
                
                <Text style={{marginLeft:10,marginTop:10}}>
                    {this.state.isConnected?'當前連接的設備':'可用設備'}
                </Text>
            </View>
        )
    }

    renderFooter=()=>{
        return(
            <View style={{marginBottom:30}}>
                {this.state.isConnected? this.show = true: this.show = false}

                <View style={styles.outerContainer}>
                    {this.renderWriteView('寫入數據(write)：','發送',
                            BluetoothManager.writeWithResponseCharacteristicUUID,this.write)}
                    {this.renderWriteView('寫入數據(writeWithoutResponse)：','發送',
                            BluetoothManager.writeWithoutResponseCharacteristicUUID,this.writeWithoutResponse,)}
                    {this.renderReceiveView('讀取的數據：','讀取',
                            BluetoothManager.readCharacteristicUUID,this.read,this.state.readData)}
                    {this.renderReceiveView(`監聽接收的數據：${this.state.isMonitoring?'監聽已開啟':'監聽未開啟'}`,'開啟監聽',
                            BluetoothManager.nofityCharacteristicUUID,this.monitor,this.state.receiveData)}
                </View>                   
                <View style={{marginBottom:20}}></View>
                   
            </View>
        )
    }

    renderWriteView=(label,buttonText,characteristics,onPress,state)=>{
        if(characteristics.length == 0){
            return null;
        }
        return(
            <View style={{marginHorizontal:10,marginTop:30}} behavior='padding'>
                <Text style={{color:'black'}}>{label}</Text>
                    <Text style={styles.content}>
                        {this.state.writeData}
                    </Text>                        
                    {characteristics.map((item,index)=>{
                        return(
                            <TouchableOpacity 
                                key={index}
                                activeOpacity={0.7} 
                                style={styles.buttonView} 
                                onPress={()=>{onPress(index)}}>
                                <Text style={styles.buttonText}>{buttonText} ({item})</Text>
                            </TouchableOpacity>
                        )
                    })}      
                    <TextInput
                        style={[styles.textInput]}
                        value={this.state.text}
                        placeholder='請輸入信息'
                        onChangeText={(text)=>{
                            this.setState({text:text});
                        }}
                    />
            </View>
        )
    }

    renderReceiveView=(label,buttonText,characteristics,onPress,state)=>{
        if(characteristics.length == 0){
            return null;
        }
        return(
            <View style={{marginHorizontal:10,marginTop:30}}>
                <Text style={{color:'black',marginTop:5}}>{label}</Text>               
                <Text style={styles.content}>
                    {state}
                </Text>
                {characteristics.map((item,index)=>{
                    return(
                        <TouchableOpacity 
                            activeOpacity={0.7} 
                            style={styles.buttonView} 
                            onPress={()=>{onPress(index)}} 
                            key={index}>
                            <Text style={styles.buttonText}>{buttonText} ({item})</Text>
                        </TouchableOpacity>
                    )
                })}        
            </View>
        )
    }   

    render () {
        return (
            <View style={styles.container}>  
                <FlatList 
                    renderItem={this.renderItem}
                    keyExtractor={item=>item.id}
                    data={this.state.data}
                    ListHeaderComponent={this.renderHeader}
                    ListFooterComponent={this.renderFooter}
                    extraData={[this.state.isConnected,this.state.text,this.state.receiveData,this.state.readData,this.state.writeData,this.state.isMonitoring,this.state.scaning]}
                    keyboardShouldPersistTaps='handled'
                />      
            </View>
        );
    }
}

const styles = StyleSheet.create({   
    container: {
        flex: 1,
        backgroundColor:'white',
        marginTop:Platform.OS == 'ios'?20:0,
    },
    item:{
        flexDirection:'column',
        borderColor:'rgb(235,235,235)',
        borderStyle:'solid',
        borderBottomWidth:StyleSheet.hairlineWidth,
        paddingLeft:10,
        paddingVertical:8,       
    },
    buttonView:{
        height:30,
        backgroundColor:'rgb(33, 150, 243)',
        paddingHorizontal:10,
        borderRadius:5,
        justifyContent:"center",   
        alignItems:'center',
        alignItems:'flex-start',
        marginTop:10
    },
    buttonText:{
        color:"white",
        fontSize:12,
    },
    content:{        
        marginTop:5,
        marginBottom:15,        
    },
    textInput:{       
		paddingLeft:5,
		paddingRight:5,
		backgroundColor:'white',
		height:50,
        fontSize:16,
        flex:1,
	},
    outerContainer : {
        flex : 1,
        flexDirection : 'column',
        backgroundColor : 'black'
      },
      directionText : {
        position : 'absolute',
        bottom : 90,
        color:'#fff',
        textAlign:'center',
        fontSize : 20
      },
      drivingButtonsContainer : {
        position : 'absolute',
        flexDirection : 'row',
        bottom : 10,
        width : '100%',
        justifyContent: 'space-between',
        alignItems : 'center',
      },
      drivingButton : {
        height: 50,
        width: 70,
        marginTop: 10,
        marginBottom: 10,
        marginLeft : 5,
        marginRight : 5,
        backgroundColor:'#68a0cf',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fff',
      },
      buttonText: {
        color:'#fff',
        textAlign:'center',
        fontSize : 20
      },
})



