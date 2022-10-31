import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {
  baseUrl: any = environment.baseUrl;
  constructor(private http: HttpClient, private toastController: ToastController, private loadingCtrl: LoadingController) { }


  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'bottom'
    });

    await toast.present();
  }

  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Wait...',
      spinner: 'circles',
    });

    loading.present();
  }
  async dissMissLoading() {
    this.loadingCtrl.dismiss();
  }

  login(data) {
    return this.http.get(this.baseUrl + 'login.php?email=' + data.userName + '&password=' + data.password);
  }
  bookOnOff(userId) {
    return this.http.get(this.baseUrl + 'button.php?userid=' + userId);
  }
  createBook(userId, button, code) {
    return this.http.get(this.baseUrl + 'book.php?userid=' + userId + '&book=' + button + '&code=' + code);
  }
  spotCheck(userId, code) {
    return this.http.get(this.baseUrl + 'spotcheck.php?userid=' + userId + '&code=' + code);
  }

  updateFCMToken(userId, token) {
    return this.http.get(this.baseUrl + 'update-token.php?userid=' + userId + '&token=' + token);
  }

  syncOffline(userId, data){
    return this.http.get(this.baseUrl + 'spotcheck-offline.php?userid=' + userId + '&data=' + data);
  }
}
