// generated using chatgpt4

graph LR
    A[User] -->|Access| B((React Mobile App))
    A -->|Access| C((React Web App))
    B -->|API Calls| D{Istio Service Mesh}
    C -->|API Calls| D
    D --> E[User Service]
    D --> F[Shopping Cart Service]
    D --> G[Checkout Service]
    D --> H[Consultation Service]
    E -->|Read/Write| I((AWS RDS))
    F -->|Read/Write| I
    G -->|Read/Write| I
    H -->|Read/Write| I
    E -->|Authenticate| J((AWS Cognito))
    F -->|Store Images| K((AWS S3))
    subgraph "AWS EKS"
    D
    E
    F
    G
    H
    end
    L[ArgoCD] -->|Deploy| D
    L -->|Deploy| E
    L -->|Deploy| F
    L -->|Deploy| G
    L -->|Deploy| H
    D -->|Monitor| M[DataDog]
    E -->|Monitor| M
    F -->|Monitor| M
    G -->|Monitor| M
    H -->|Monitor| M

