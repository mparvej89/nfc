import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiServiceService } from '../api-service.service';
import { NFC, Ndef } from '@awesome-cordova-plugins/nfc/ngx';
import { ActionSheetController, Platform, ToastController } from '@ionic/angular';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  userInfo: any;
  button: any;
  readerMode: any;
  networkStatus: any;
  spotData: any[] = localStorage.getItem('NFC-CODE') == null ? [] : JSON.parse(localStorage.getItem('NFC-CODE'));
  offLineSpotData: any[] = [];
  actionSheet: HTMLIonActionSheetElement;
  constructor(private router: Router, private api: ApiServiceService,
    private nfc: NFC, private ndef: Ndef, private platform: Platform,
    private toast: ToastController, private actionSheetCtrl: ActionSheetController) {

  }

  ngOnInit() {
    Network.addListener('networkStatusChange', (status) => {
      this.networkStatus = status.connected;
      this.presentToast();
    });
  }


  async presentToast() {
    let msg = this.networkStatus ? 'Connected' : 'Disconnected'
    const toast = await this.toast.create({
      message: 'Network ' + msg,
      duration: 1500,
      position: 'bottom',
      cssClass: msg,
    });

    await toast.present();
  }



  ionViewWillEnter() {
    this.userInfo = JSON.parse(localStorage.getItem('UserInfo'));
    this.offLineSpotData = localStorage.getItem('NFC-CODE') == null ? [] : JSON.parse(localStorage.getItem('NFC-CODE'));
    this.api.updateFCMToken(this.userInfo.userid, localStorage.getItem('FCM-Token')).subscribe(res => {
      console.log('token update', res);
    }, err => {
      console.log('token err', err);
    })
    this.bookOnOff();
  }

  bookOnOff() {
    this.api.showLoading();
    this.api.bookOnOff(this.userInfo.userid).subscribe((res: any) => {
      if (res) {
        this.button = res.button;
      }
      this.api.dissMissLoading();
    }, err => {
      this.api.dissMissLoading();
    })
  }


  logout() {
    localStorage.clear();
    this.router.navigate(['./home']);
  }

  async scanNfc(type) {
    let code;
    if (this.platform.is('android')) {
      this.presentActionSheet();
      let flags = this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NFC_V;
      this.readerMode = this.nfc.readerMode(flags).subscribe(tag => {
        let value = tag.ndefMessage[0]["payload"];
        code = this.nfc.bytesToString(value);
        if (code) {
          this.actionSheet.dismiss().then(res => {
            if (type == 'BOOK') {
              this.createBook(code);
              window.location.reload();
            }
            else {
              this.spotCheck(code);
            }
          })
        }

      }, err => {
        console.log('Error reading tag', err);
        alert(JSON.stringify(err));
      });
    }
    else {
      // Read NFC Tag - iOS
      // On iOS, a NFC reader session takes control from your app while scanning tags then returns a tag
      try {
        let tag = await this.nfc.scanNdef();
        let value = tag.ndefMessage[0]["payload"];
        code = this.nfc.bytesToString(value);
        if (type == 'BOOK') {
          this.createBook(code);
        }
        else {
          this.spotCheck(code);
        }
      } catch (err) {
        console.log('Error reading tag', err);
        alert(JSON.stringify(err));
      }
    }
  }

  book() {
    this.scanNfc('BOOK');
   
  }

  createBook(code) {
    this.api.createBook(this.userInfo.userid, this.button, code).subscribe((res: any) => {
      if (res.status == 'success') {
        this.api.presentToast(res.details);
        this.bookOnOff();
      }
      else {
        this.api.presentToast(res.details);
      }
    }, err => {
      this.api.presentToast('Something went wrong!');
    })
  }

  spotCheck(code) {
    if (this.networkStatus) {
      this.api.spotCheck(this.userInfo.userid, code).subscribe((res: any) => {
        if (res.status == 'success') {
          this.api.presentToast(res.details);
        }
        else {
          this.api.presentToast(res.details);
        }
      }, err => {
        this.api.presentToast('Something went wrong!');
      })
    }
    else {
      let spdata = {
        dateTime: new Date().toLocaleString(),
        code: code
      }
      this.spotData.push(spdata);
      localStorage.setItem('NFC-CODE', JSON.stringify(this.spotData));
      this.offLineSpotData = JSON.parse(localStorage.getItem('NFC-CODE'));
    }

  }


  async testNfc() {
    let code;
    let flags = this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NFC_V;
    if (this.platform.is('android')) {
      this.presentActionSheet();
      this.readerMode = this.nfc.readerMode(flags).subscribe(tag => {
        let value = tag.ndefMessage[0]["payload"];
        code = this.nfc.bytesToString(value);
        if (code) {
          this.actionSheet.dismiss().then(res => {
            alert(code);
          })
        }
      }, err => {
        console.log('Error reading tag', err);
        alert(JSON.stringify(err));
      });
    }
    else {
      // Read NFC Tag - iOS
      // On iOS, a NFC reader session takes control from your app while scanning tags then returns a tag
      try {
        let tag = await this.nfc.scanNdef();
        let value = tag.ndefMessage[0]["payload"];
        code = this.nfc.bytesToString(value);
        alert(code);
      } catch (err) {
        console.log('Error reading tag', err);
        alert(JSON.stringify(err));
      }
    }
  }

  syncOffline() {
    if (this.networkStatus) {
      this.api.showLoading();
      this.offLineSpotData = JSON.parse(localStorage.getItem('NFC-CODE'));
      this.api.syncOffline(this.userInfo.userid, JSON.stringify(this.offLineSpotData)).subscribe((res: any) => {
        if (res.status == 'success') {
          localStorage.removeItem('NFC-CODE');
          this.spotData = [];
          this.offLineSpotData = localStorage.getItem('NFC-CODE') == null ? [] : JSON.parse(localStorage.getItem('NFC-CODE'));
          this.api.presentToast(res.details);
          this.api.dissMissLoading();
        }
        else {
          this.api.presentToast(res.details);
          this.api.dissMissLoading();
        }
      }, err => {
        this.api.dissMissLoading();
        this.api.presentToast('Something went wrong!');
        console.log(err);

      })
    }
    else {
      this.api.presentToast('Currently you are offline please check your internet!!');
    }

  }

  async presentActionSheet() {
    this.actionSheet = await this.actionSheetCtrl.create({
      header: 'Ready to Scan',
      subHeader: 'Hold near NFC tag to scan',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          data: {
            action: 'cancel',
          },
        },
      ],
    });
    await this.actionSheet.present();
  }
}
