import requests


TOKEN = "7594613412:AAEhZd1L2fh7te_JBbY-BzN4hJttQRTBR40"
CHAT_ID = "7755309376"

# url = f"https://api.telegram.org/bot{TOKEN}/getUpdates"
# print(requests.get(url).json())

def receiveMess(): 
    # receive message here
    mess = "dummy mes";
    return mess

def checkMessing(mess):    
    # code here 
    return True

def sendMessage(mess):
    url = f"http://api.telegram.org/bot{TOKEN}/sendMessage?chat_id={CHAT_ID}&text={mess}"
    res = requests.get(url)
    return res

if __name__ == "__main__":

    mes = receiveMess()
    cnt = 0

    while checkMessing(mes): 
        res = sendMessage(mes)
        cnt += 1
        if cnt == 10: break
        mes = receiveMess()
        print(res.json())
